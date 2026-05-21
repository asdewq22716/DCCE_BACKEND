import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FncDB } from 'src/common/services/fnc-db.service';
import { AuditLogService, AuditContext } from 'src/common/services/audit-log.service';
import { FncCustom } from 'src/common/fnc-custom';
import { AssignUserDto } from './dto/assign-user.dto';
import { CreateBranchWithUnitsDto } from './dto/create-branch-with-units.dto';
import { UpdateBranchWithUnitsDto } from './dto/update-branch-with-units.dto';
import { OrganizationType } from './types/organization.type';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly db: FncDB,
    private readonly auditLog: AuditLogService,
  ) { }

  // 1.1 สร้างสาขาพร้อมหน่วยงานย่อยรวดเดียว (Bulk Insert ด้วย Database Transaction)
  async createBranchWithUnits(
    dto: CreateBranchWithUnitsDto,
    context?: AuditContext,
  ): Promise<OrganizationType> {
    const trimmedBranchName = dto.branch_name.trim();
    if (!trimmedBranchName) {
      throw new BadRequestException('ชื่อสาขาหลักไม่สามารถเป็นช่องว่างได้');
    }

    // เช็คว่ามีสาขาชื่อนี้ซ้ำกันในระบบอยู่แล้วหรือไม่ (ใช้ query ทั่วไป ไม่ถือครอง connection client ค้างไว้)
    const existingBranch = await this.db.query(
      'SELECT * FROM organizations WHERE org_name = $1 AND parent_id IS NULL AND is_active = 1',
      [trimmedBranchName],
    );

    if (existingBranch.length > 0) {
      throw new BadRequestException('ชื่อสาขาหลักนี้มีอยู่ในระบบแล้ว');
    }

    const client = await this.db.startTransaction();

    try {
      // ขั้นตอน A: บันทึกสาขาหลัก (level = 1, is_active = 1)
      const branch = await this.db.insert(
        'organizations',
        {
          org_name: trimmedBranchName,
          parent_id: null,
          sort_order: 0,
          level: 1,
          is_active: 1,
        },
        client,
      );

      const insertedUnits = [];

      // ขั้นตอน B: ลูปบันทึกหน่วยงานย่อย (level = 2, is_active = 1)
      if (dto.units && dto.units.length > 0) {
        for (const unit of dto.units) {
          const trimmedUnitName = unit.org_name.trim();
          if (!trimmedUnitName) {
            throw new BadRequestException('ชื่อหน่วยงานย่อยไม่สามารถเป็นช่องว่างได้');
          }

          const insertedUnit = await this.db.insert(
            'organizations',
            {
              org_name: trimmedUnitName,
              parent_id: branch.org_id,
              sort_order: unit.sort_order || 0,
              level: 2,
              is_active: 1,
            },
            client,
          );

          insertedUnits.push(insertedUnit);
        }
      }

      // บันทึกกิจกรรมลงตาราง Log กลางผ่าน AuditLogService แบบ Global
      await this.auditLog.log(
        client,
        {
          actionType: 'CREATE',
          moduleName: 'organizations',
          recordId: branch.org_id.toString(),
          oldData: null,
          newData: { ...branch, units: insertedUnits },
          remark: `สร้างสาขาหลัก "${trimmedBranchName}" พร้อมหน่วยงานย่อย ${insertedUnits.length} แห่ง`,
        },
        context,
      );

      await this.db.commit(client);

      return {
        ...branch,
        units: insertedUnits,
      };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Create branch with units error: ${err.message}`);
      throw err;
    }
  }

  // 3. ดึงรายชื่อสาขาหลักทั้งหมด พร้อมหน่วยงานย่อย (ไม่ดึงตัวที่ถูกลบ is_active = 0)
  async findAllBranches(id?: number): Promise<OrganizationType | OrganizationType[]> {
    try {
      if (id) {
        // กรณีดึงสาขาเดี่ยวตาม id
        const branchRows = await this.db.query(
          `SELECT org_id, org_name, parent_id, sort_order, level, is_active 
           FROM organizations 
           WHERE org_id = $1 AND parent_id IS NULL AND is_active = 1`,
          [id],
        );
        if (branchRows.length === 0) {
          throw new NotFoundException('ไม่พบข้อมูลสาขาหลักที่ระบุ');
        }
        const branch = branchRows[0];

        const units = await this.db.query(
          `SELECT 
             o.org_id, 
             o.org_name, 
             o.parent_id,
             o.sort_order,
             o.level,
             o.is_active,
             COALESCE(COUNT(uo.user_id), 0)::int AS user_count
           FROM organizations o
           LEFT JOIN user_organizations uo ON o.org_id = uo.org_id
           WHERE o.parent_id = $1 AND o.is_active = 1
           GROUP BY o.org_id, o.org_name, o.parent_id, o.sort_order, o.level, o.is_active
           ORDER BY o.sort_order ASC, o.org_id ASC`,
          [id],
        );

        return {
          org_id: branch.org_id,
          org_name: branch.org_name,
          parent_id: branch.parent_id,
          sort_order: branch.sort_order,
          level: branch.level,
          is_active: branch.is_active,
          units: units.map((u: any) => ({
            org_id: u.org_id,
            org_name: u.org_name,
            parent_id: u.parent_id,
            sort_order: u.sort_order,
            level: u.level,
            is_active: u.is_active,
            user_count: u.user_count,
          })),
        };
      } else {
        // กรณีดึงทุกสาขาหลัก
        const branches = await this.db.query(
          `SELECT org_id, org_name, parent_id, sort_order, level, is_active 
           FROM organizations 
           WHERE parent_id IS NULL AND is_active = 1 
           ORDER BY sort_order ASC, org_id ASC`,
        );

        // ดึงแผนกย่อยทั้งหมดที่พ่วงจำนวนผู้ใช้
        const allUnits = await this.db.query(
          `SELECT 
             o.org_id, 
             o.org_name, 
             o.parent_id,
             o.sort_order,
             o.level,
             o.is_active,
             COALESCE(COUNT(uo.user_id), 0)::int AS user_count
           FROM organizations o
           LEFT JOIN user_organizations uo ON o.org_id = uo.org_id
           WHERE o.parent_id IS NOT NULL AND o.is_active = 1
           GROUP BY o.org_id, o.org_name, o.parent_id, o.sort_order, o.level, o.is_active
           ORDER BY o.sort_order ASC, o.org_id ASC`,
        );

        // จับคู่หน่วยงานย่อยใส่เข้าในแต่ละสาขาหลัก
        for (const branch of branches) {
          branch.units = allUnits
            .filter((unit: any) => unit.parent_id === branch.org_id)
            .map((unit: any) => ({
              org_id: unit.org_id,
              org_name: unit.org_name,
              parent_id: unit.parent_id,
              sort_order: unit.sort_order,
              level: unit.level,
              is_active: unit.is_active,
              user_count: unit.user_count,
            }));
        }

        // แมปคืนค่าเฉพาะฟิลด์ที่ระบุใน OrganizationType
        return branches.map((branch: any) => ({
          org_id: branch.org_id,
          org_name: branch.org_name,
          parent_id: branch.parent_id,
          sort_order: branch.sort_order,
          level: branch.level,
          is_active: branch.is_active,
          units: branch.units,
        }));
      }
    } catch (err: any) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Find branches with units error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถดึงข้อมูลรายชื่อสาขาได้');
    }
  }

  // ---------- 7. User Organizations Assignment (ผูกสังกัดผู้ใช้งาน) ----------

  // 7.1 ผูกผู้ใช้งานเข้าสังกัดหน่วยงาน
  async assignUserToOrg(dto: AssignUserDto) {
    const userExists = await this.db.select('users', { user_id: dto.user_id });
    if (userExists.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งานที่ระบุ');
    }

    await this.findOneOrg(dto.org_id);

    const existing = await this.db.select('user_organizations', {
      user_id: dto.user_id,
      org_id: dto.org_id,
    });
    if (existing.length > 0) {
      throw new BadRequestException(
        'ผู้ใช้งานรายนี้มีรายชื่อผูกเข้าสังกัดหน่วยงานนี้อยู่แล้ว',
      );
    }

    try {
      return await this.db.insert('user_organizations', dto);
    } catch (err: any) {
      this.logger.error(`Assign user to organization error: ${err.message}`);
      throw new BadRequestException(
        'ไม่สามารถดำเนินการจัดสรรผู้ใช้งานเข้าสังกัดได้',
      );
    }
  }

  // 7.2 ถอดถอนผู้ใช้งานออกจากสังกัดหน่วยงาน
  async removeUserFromOrg(dto: AssignUserDto) {
    try {
      const deletedCount = await this.db.delete('user_organizations', {
        user_id: dto.user_id,
        org_id: dto.org_id,
      });
      if (deletedCount === 0) {
        throw new NotFoundException(
          'ไม่พบข้อมูลการสังกัดผู้ใช้ในหน่วยงานที่ต้องการถอดถอน',
        );
      }
      return { message: 'ถอดถอนผู้ใช้งานออกจากหน่วยงานเรียบร้อยแล้ว' };
    } catch (err: any) {
      this.logger.error(`Remove user from organization error: ${err.message}`);
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new BadRequestException(
        'ไม่สามารถดำเนินการถอดถอนผู้ใช้งานออกจากหน่วยงานได้',
      );
    }
  }

  // 1.2 แก้ไขสาขาพร้อมหน่วยงานย่อยรวดเดียว (Bulk Upsert & Delete)
  async updateBranchWithUnits(
    dto: UpdateBranchWithUnitsDto,
    context?: AuditContext,
  ) {
    const branchId = dto.branch_id;
    const branchExists = await this.db.select('organizations', { org_id: branchId, is_active: 1 });
    if (branchExists.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลสาขาหลักที่ต้องการแก้ไข');
    }
    if (branchExists[0].parent_id !== null) {
      throw new BadRequestException('รหัสที่ระบุไม่ใช่สาขาหลัก');
    }

    const trimmedBranchName = dto.branch_name.trim();
    if (!trimmedBranchName) {
      throw new BadRequestException('ชื่อสาขาหลักไม่สามารถเป็นช่องว่างได้');
    }

    const client = await this.db.startTransaction();

    try {
      // ขั้นตอน A: อัปเดตข้อมูลสาขาหลัก
      const duplicateCheck = await this.db.queryTx(
        client,
        'SELECT * FROM organizations WHERE org_name = $1 AND parent_id IS NULL AND org_id <> $2 AND is_active = 1',
        [trimmedBranchName, branchId],
      );
      if (duplicateCheck.length > 0) {
        throw new BadRequestException('ชื่อสาขาหลักนี้มีอยู่ในระบบแล้ว');
      }

      await this.db.update(
        'organizations',
        {
          org_name: trimmedBranchName,
          is_active: dto.is_active ?? branchExists[0].is_active,
          updated_at: FncCustom.dateNow()
        },
        { org_id: branchId },
        client,
      );

      // ขั้นตอน B: อัปเดตหน่วยงานย่อย หรือสร้างหน่วยงานย่อยใหม่ (หากมีการส่งมา)
      const processedUnits = [];
      if (dto.units && dto.units.length > 0) {
        for (const unit of dto.units) {
          const trimmedUnitName = unit.org_name.trim();
          if (!trimmedUnitName) {
            throw new BadRequestException('ชื่อหน่วยงานย่อย/แผนกไม่สามารถเป็นช่องว่างได้');
          }

          if (unit.org_id) {
            // แผนกเดิม: ตรวจสอบความถูกต้องและอัปเดตข้อมูล
            // ดึงข้อมูลเดิมรวมถึงตัวที่ is_active = 0 ด้วย เผื่ออัปเดตกลับมาเปิดใช้งาน
            const unitRecord = await this.db.queryTx(
              client,
              'SELECT * FROM organizations WHERE org_id = $1',
              [unit.org_id],
            );
            if (unitRecord.length === 0 || unitRecord[0].parent_id !== branchId) {
              throw new BadRequestException(`หน่วยงานย่อยรหัส ${unit.org_id} ไม่ได้อยู่ภายใต้สาขาหลักนี้`);
            }

            // ตรวจสอบความปลอดภัยกรณีสั่งปิดใช้งาน/ลบ (is_active = 0)
            if (unit.is_active === 0 && unitRecord[0].is_active === 1) {
              const assignedUsers = await this.db.queryTx(
                client,
                'SELECT * FROM user_organizations WHERE org_id = $1',
                [unit.org_id],
              );
              if (assignedUsers.length > 0) {
                throw new BadRequestException(
                  `ไม่สามารถปิดใช้งานแผนก "${trimmedUnitName}" ได้ เนื่องจากยังมีพนักงานผูกสังกัดอยู่`,
                );
              }
            }

            await this.db.update(
              'organizations',
              {
                org_name: trimmedUnitName,
                sort_order: unit.sort_order ?? 0,
                is_active: unit.is_active ?? unitRecord[0].is_active,
                updated_at: FncCustom.dateNow()
              },
              { org_id: unit.org_id },
              client,
            );

            processedUnits.push({
              org_id: unit.org_id,
              org_name: trimmedUnitName,
              parent_id: branchId,
              sort_order: unit.sort_order ?? 0,
              level: unitRecord[0].level,
              is_active: unit.is_active ?? unitRecord[0].is_active,
            });
          } else {
            // แผนกใหม่: บันทึกข้อมูลเพิ่ม
            const newUnit = await this.db.insert(
              'organizations',
              {
                org_name: trimmedUnitName,
                parent_id: branchId,
                sort_order: unit.sort_order ?? 0,
                level: 2,
                is_active: unit.is_active ?? 1,
              },
              client,
            );
            processedUnits.push(newUnit);
          }
        }
      }

      // บันทึกกิจกรรมลงตาราง Log กลางผ่าน AuditLogService แบบ Global
      await this.auditLog.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'organizations',
          recordId: branchId.toString(),
          oldData: branchExists[0],
          newData: dto,
          remark: dto.remark,
        },
        context,
      );

      await this.db.commit(client);

      return {
        message: 'แก้ไขข้อมูลสาขาและหน่วยงานย่อยเรียบร้อยแล้ว',
        branch_id: branchId,
        branch_name: trimmedBranchName,
        units: processedUnits,
      };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Update branch with units error: ${err.message}`);
      throw err;
    }
  }

  // 2. ดึงข้อมูลหน่วยงาน/สาขาตาม ID
  async findOneOrg(id: number): Promise<OrganizationType> {
    const orgs = await this.db.select('organizations', { org_id: id, is_active: 1 });
    if (orgs.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลหน่วยงานที่ระบุ');
    }
    return orgs[0];
  }

  // 1.3 ลบสาขาหลักพร้อมแผนกย่อยทั้งหมดภายใต้สาขานั้น (Soft Delete ด้วย Database Transaction)
  async deleteBranch(id: number, context?: AuditContext) {
    const branchExists = await this.db.select('organizations', { org_id: id, is_active: 1 });
    if (branchExists.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลสาขาหลักที่ระบุ');
    }
    if (branchExists[0].parent_id !== null) {
      throw new BadRequestException('รหัสที่ระบุไม่ใช่สาขาหลัก');
    }

    const client = await this.db.startTransaction();

    try {
      // ดึงหน่วยงานย่อยทั้งหมดภายใต้สาขานี้ที่ยังไม่ลบ (is_active = 1)
      const childUnits = await this.db.queryTx(
        client,
        'SELECT org_id, org_name FROM organizations WHERE parent_id = $1 AND is_active = 1',
        [id],
      );

      // รวบรวม IDs ของสาขาและแผนกย่อยทั้งหมด
      const targetIds = [id, ...childUnits.map((u: any) => u.org_id)];

      // ตรวจสอบพนักงานที่ยังผูกติดอยู่ในระบบ
      const assignedUsers = await this.db.queryTx(
        client,
        'SELECT * FROM user_organizations WHERE org_id = ANY($1)',
        [targetIds],
      );

      if (assignedUsers.length > 0) {
        throw new BadRequestException(
          'ไม่สามารถลบสาขาหลักนี้ได้ เนื่องจากยังมีพนักงานผูกสังกัดอยู่ภายใต้สาขาหรือแผนกย่อยนี้',
        );
      }

      // ดำเนินการ Soft Delete โดยเซ็ต is_active = 0
      await this.db.queryTx(
        client,
        'UPDATE organizations SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE org_id = ANY($1)',
        [targetIds],
      );

      // บันทึกกิจกรรมลงตาราง Log กลางผ่าน AuditLogService แบบ Global
      await this.auditLog.log(
        client,
        {
          actionType: 'DELETE',
          moduleName: 'organizations',
          recordId: id.toString(),
          oldData: {
            branch: branchExists[0],
            childUnits: childUnits,
          },
          newData: null,
          remark: `ลบสาขาหลัก "${branchExists[0].org_name}" พร้อมหน่วยงานย่อยภายใต้สาขาทั้งหมด`,
        },
        context,
      );

      await this.db.commit(client);

      return {
        message: 'ลบข้อมูลสาขาหลักและหน่วยงานย่อยทั้งหมดเรียบร้อยแล้ว',
        deleted_branch_id: id,
        deleted_units_count: childUnits.length,
      };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Delete branch error: ${err.message}`);
      throw err;
    }
  }
}
