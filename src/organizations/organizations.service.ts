import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FncDB } from 'src/common/services/fnc-db.service';
import { AssignUserDto } from './dto/assign-user.dto';
import { CreateBranchWithUnitsDto } from './dto/create-branch-with-units.dto';
import { UpdateBranchWithUnitsDto } from './dto/update-branch-with-units.dto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private readonly db: FncDB) { }

  // 1.1 สร้างสาขาพร้อมหน่วยงานย่อยรวดเดียว (Bulk Insert ด้วย Database Transaction)
  async createBranchWithUnits(dto: CreateBranchWithUnitsDto) {
    const trimmedBranchName = dto.branch_name.trim();
    if (!trimmedBranchName) {
      throw new BadRequestException('ชื่อสาขาหลักไม่สามารถเป็นช่องว่างได้');
    }

    const client = await this.db.startTransaction();

    // เช็คว่ามีสาขาชื่อนี้ซ้ำกันในระบบอยู่แล้วหรือไม่ (เฉพาะที่ยังไม่ถูกลบ is_active = 1)
    const existingBranch = await this.db.queryTx(
      client,
      'SELECT * FROM organizations WHERE org_name = $1 AND parent_id IS NULL AND is_active = 1',
      [trimmedBranchName],
    );

    if (existingBranch.length > 0) {
      throw new BadRequestException('ชื่อสาขาหลักนี้มีอยู่ในระบบแล้ว');
    }

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
  async findAllBranches(id?: number) {
    try {
      if (id) {
        // กรณีดึงสาขาเดี่ยวตาม id
        const branchRows = await this.db.query(
          'SELECT * FROM organizations WHERE org_id = $1 AND parent_id IS NULL AND is_active = 1',
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
             o.created_at,
             o.updated_at,
             o.sort_order,
             o.level,
             o.is_active,
             COALESCE(COUNT(uo.user_id), 0)::int AS user_count
           FROM organizations o
           LEFT JOIN user_organizations uo ON o.org_id = uo.org_id
           WHERE o.parent_id = $1 AND o.is_active = 1
           GROUP BY o.org_id, o.org_name, o.parent_id, o.created_at, o.updated_at, o.sort_order, o.level, o.is_active
           ORDER BY o.sort_order ASC, o.org_id ASC`,
          [id],
        );

        return {
          ...branch,
          units: units,
        };
      } else {
        // กรณีดึงทุกสาขาหลัก
        const branches = await this.db.query(
          'SELECT * FROM organizations WHERE parent_id IS NULL AND is_active = 1 ORDER BY sort_order ASC, org_id ASC',
        );

        // ดึงแผนกย่อยทั้งหมดที่พ่วงจำนวนผู้ใช้
        const allUnits = await this.db.query(
          `SELECT 
             o.org_id, 
             o.org_name, 
             o.parent_id,
             o.created_at,
             o.updated_at,
             o.sort_order,
             o.level,
             o.is_active,
             COALESCE(COUNT(uo.user_id), 0)::int AS user_count
           FROM organizations o
           LEFT JOIN user_organizations uo ON o.org_id = uo.org_id
           WHERE o.parent_id IS NOT NULL AND o.is_active = 1
           GROUP BY o.org_id, o.org_name, o.parent_id, o.created_at, o.updated_at, o.sort_order, o.level, o.is_active
           ORDER BY o.sort_order ASC, o.org_id ASC`,
        );

        // แมปหน่วยงานย่อยใส่เข้าสาขาหลักของตนเอง
        return branches.map((branch: any) => {
          const branchUnits = allUnits.filter(
            (unit: any) => unit.parent_id === branch.org_id,
          );
          return {
            ...branch,
            units: branchUnits,
          };
        });
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
  async updateBranchWithUnits(dto: UpdateBranchWithUnitsDto) {
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
          updated_at: new Date() 
        },
        { org_id: branchId },
        client,
      );

      // ขั้นตอน B: ดึง ID ของแผนกย่อยทั้งหมดที่ถูกส่งมาจาก DTO
      const sentUnitIds = dto.units
        .map((u) => u.org_id)
        .filter((id): id is number => typeof id === 'number' && id > 0);

      // ขั้นตอน C: ทำ Soft Delete แผนกย่อยเก่าที่ไม่ได้ถูกส่งมารอบนี้ (เซ็ต is_active = 0)
      let deleteQuery = 'SELECT org_id, org_name FROM organizations WHERE parent_id = $1 AND is_active = 1';
      const deleteQueryParams: any[] = [branchId];
      if (sentUnitIds.length > 0) {
        deleteQuery += ' AND org_id <> ALL($2)';
        deleteQueryParams.push(sentUnitIds);
      }

      const unitsToDelete = await this.db.queryTx(client, deleteQuery, deleteQueryParams);

      for (const u of unitsToDelete) {
        // ห้ามลบแผนกย่อยหากยังมีพนักงานผูกสังกัดอยู่
        const assignedUsers = await this.db.queryTx(client, 'SELECT * FROM user_organizations WHERE org_id = $1', [u.org_id]);
        if (assignedUsers.length > 0) {
          throw new BadRequestException(
            `ไม่สามารถลบแผนก "${u.org_name}" ได้ เนื่องจากยังมีพนักงานผูกสังกัดอยู่ในแผนกนี้`,
          );
        }
      }

      if (unitsToDelete.length > 0) {
        const deleteIds = unitsToDelete.map((u: any) => u.org_id);
        await this.db.queryTx(
          client,
          'UPDATE organizations SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE org_id = ANY($1)',
          [deleteIds],
        );
      }

      // ขั้นตอน D: อัปเดตแผนกเดิม หรือสร้างแผนกใหม่เพิ่มเข้ามา
      const processedUnits = [];
      for (const unit of dto.units) {
        const trimmedUnitName = unit.org_name.trim();
        if (!trimmedUnitName) {
          throw new BadRequestException('ชื่อหน่วยงานย่อย/แผนกไม่สามารถเป็นช่องว่างได้');
        }

        if (unit.org_id) {
          // แผนกเดิม: ตรวจสอบความถูกต้องและอัปเดตข้อมูล
          const unitRecord = await this.db.queryTx(client, 'SELECT * FROM organizations WHERE org_id = $1 AND is_active = 1', [unit.org_id]);
          if (unitRecord.length === 0 || unitRecord[0].parent_id !== branchId) {
            throw new BadRequestException(`หน่วยงานย่อยรหัส ${unit.org_id} ไม่ได้อยู่ภายใต้สาขาหลักนี้`);
          }

          await this.db.update(
            'organizations',
            { 
              org_name: trimmedUnitName, 
              sort_order: unit.sort_order ?? 0, 
              updated_at: new Date() 
            },
            { org_id: unit.org_id },
            client,
          );

          processedUnits.push({
            org_id: unit.org_id,
            org_name: trimmedUnitName,
            sort_order: unit.sort_order ?? 0,
            level: unitRecord[0].level,
            is_active: unitRecord[0].is_active,
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
              is_active: 1,
            },
            client,
          );
          processedUnits.push(newUnit);
        }
      }

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
  async findOneOrg(id: number) {
    const orgs = await this.db.select('organizations', { org_id: id, is_active: 1 });
    if (orgs.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลหน่วยงานที่ระบุ');
    }
    return orgs[0];
  }

  // 1.3 ลบสาขาหลักพร้อมแผนกย่อยทั้งหมดภายใต้สาขานั้น (Soft Delete ด้วย Database Transaction)
  async deleteBranch(id: number) {
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
