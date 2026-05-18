import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FncDB } from 'src/common/services/fnc-db.service';
import { UpdateOrgDto } from './dto/update-org.dto';
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

    // เริ่มรันระบบ Transaction
    const client = await this.db.startTransaction();

    // เช็คว่ามีสาขาชื่อนี้ซ้ำกันในระบบอยู่แล้วหรือไม่
    const existingBranch = await this.db.queryTx(
      client,
      'SELECT * FROM organizations WHERE org_name = $1 AND parent_id IS NULL',
      [trimmedBranchName],
    );

    if (existingBranch.length > 0) {
      throw new BadRequestException('ชื่อสาขาหลักนี้มีอยู่ในระบบแล้ว');
    }

    try {
      // ขั้นตอน A: บันทึกสาขาหลักก่อน
      const branch = await this.db.insert(
        'organizations',
        {
          org_name: trimmedBranchName,
          parent_id: null,
          sort_order: 0,
        },
        client,
      );

      const insertedUnits = [];

      // ขั้นตอน B: ลูปบันทึกหน่วยงานย่อยตามลำดับ
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
            },
            client,
          );

          insertedUnits.push(insertedUnit);
        }
      }

      // ขั้นตอน C: Commit ยืนยันความสำเร็จทั้งหมด
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

  // 3. ดึงรายชื่อสาขาหลักทั้งหมด (หรือเฉพาะสาขาหลักเดี่ยวหากส่ง id มา) พร้อมแนบแผนกย่อย (units) ที่พ่วง user_count เรียบร้อย
  async findAllBranches(id?: number) {
    try {
      if (id) {
        // กรณีดึงสาขาเดี่ยวตาม id พร้อมแผนกย่อยด้านใน (รวมถึงนับจำนวนผู้ใช้ user_count)
        const branchRows = await this.db.query(
          'SELECT * FROM organizations WHERE org_id = $1 AND parent_id IS NULL',
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
             COALESCE(COUNT(uo.user_id), 0)::int AS user_count
           FROM organizations o
           LEFT JOIN user_organizations uo ON o.org_id = uo.org_id
           WHERE o.parent_id = $1
           GROUP BY o.org_id, o.org_name, o.parent_id, o.created_at, o.updated_at, o.sort_order
           ORDER BY o.sort_order ASC, o.org_id ASC`,
          [id],
        );

        return {
          ...branch,
          units: units,
        };
      } else {
        // กรณีดึงสาขาทั้งหมดพร้อมแผนกย่อยด้านในของแต่ละสาขา (รวมถึงนับจำนวนผู้ใช้ user_count ในแผนกย่อยทั้งหมด)
        // 1. ดึงสาขาหลักทั้งหมด
        const branches = await this.db.query(
          'SELECT * FROM organizations WHERE parent_id IS NULL ORDER BY sort_order ASC, org_id ASC',
        );

        // 2. ดึงแผนกย่อยทั้งหมดพร้อมนับจำนวนผู้ใช้จริง
        const allUnits = await this.db.query(
          `SELECT 
             o.org_id, 
             o.org_name, 
             o.parent_id,
             o.created_at,
             o.updated_at,
             o.sort_order,
             COALESCE(COUNT(uo.user_id), 0)::int AS user_count
           FROM organizations o
           LEFT JOIN user_organizations uo ON o.org_id = uo.org_id
           WHERE o.parent_id IS NOT NULL
           GROUP BY o.org_id, o.org_name, o.parent_id, o.created_at, o.updated_at, o.sort_order
           ORDER BY o.sort_order ASC, o.org_id ASC`,
        );

        // 3. แมปหน่วยงานย่อยใส่เข้าแต่ละสาขา
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

  // 5. แก้ไขข้อมูลสาขาหรือหน่วยงานย่อย
  async updateOrg(id: number, dto: UpdateOrgDto) {
    await this.findOneOrg(id);

    const updateData: Record<string, any> = {};

    if (dto.org_name !== undefined) {
      const trimmedName = dto.org_name.trim();
      if (!trimmedName) {
        throw new BadRequestException('ชื่อหน่วยงานไม่สามารถเป็นช่องว่างได้');
      }
      updateData.org_name = trimmedName;
    }

    if (dto.parent_id !== undefined) {
      if (dto.parent_id) {
        // หากระบุ parent_id ใหม่ ให้ตรวจสอบว่าหน่วยงานแม่มีจริงหรือไม่
        const parent = await this.db.select('organizations', {
          org_id: dto.parent_id,
        });
        if (parent.length === 0) {
          throw new NotFoundException(
            'ไม่พบหน่วยงานแม่ข่าย/สาขาใหม่ที่อ้างอิง',
          );
        }
        // ป้องกันไม่ให้ชี้หน่วยงานแม่เป็นไอดีตัวเอง
        if (dto.parent_id === id) {
          throw new BadRequestException(
            'ไม่สามารถระบุให้หน่วยงานแม่เป็นตัวมันเองได้',
          );
        }
      }
      updateData.parent_id = dto.parent_id || null;
    }

    updateData.updated_at = new Date();

    try {
      const updated = await this.db.update('organizations', updateData, {
        org_id: id,
      });
      if (updated === 0) {
        throw new BadRequestException('ไม่มีการเปลี่ยนแปลงข้อมูล');
      }
      return await this.findOneOrg(id);
    } catch (err: any) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      this.logger.error(`Update organization error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถบันทึกการแก้ไขข้อมูลหน่วยงานได้');
    }
  }

  // 6. ลบสาขาหรือหน่วยงานย่อยอย่างปลอดภัย (Hard Delete)
  async deleteOrg(id: number) {
    const org = await this.findOneOrg(id);

    // 6.1 ถ้าเป็นสาขาหลัก (parent_id IS NULL): ตรวจสอบว่ายังมีหน่วยงานย่อยสังกัดอยู่ใต้สาขานี้หรือไม่
    if (org.parent_id === null) {
      const childUnits = await this.db.select('organizations', {
        parent_id: id,
      });
      if (childUnits.length > 0) {
        throw new BadRequestException(
          'ไม่สามารถลบสาขานี้ได้ เนื่องจากยังมีหน่วยงานย่อยสังกัดอยู่ภายใต้สาขานี้',
        );
      }
    }

    // 6.2 ตรวจสอบความปลอดภัย: เช็คว่ามีผู้ใช้งานสังกัดอยู่ในหน่วยงาน (org_id) นี้ในตาราง user_organizations หรือไม่
    const assignedUsers = await this.db.select('user_organizations', {
      org_id: id,
    });
    if (assignedUsers.length > 0) {
      throw new BadRequestException(
        'ไม่สามารถลบหน่วยงานนี้ได้ เนื่องจากยังมีผู้ใช้งานผูกสังกัดอยู่ในหน่วยงานนี้',
      );
    }

    try {
      const deletedCount = await this.db.delete('organizations', {
        org_id: id,
      });
      if (deletedCount === 0) {
        throw new NotFoundException('ไม่พบหน่วยงานที่ต้องการลบ');
      }
      return { message: 'ลบหน่วยงานเรียบร้อยแล้ว' };
    } catch (err: any) {
      this.logger.error(`Delete organization error: ${err.message}`);
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new BadRequestException('ไม่สามารถลบข้อมูลหน่วยงานได้');
    }
  }

  // ---------- 7. User Organizations Assignment (ผูกสังกัดผู้ใช้งาน) ----------

  // 7.1 ผูกผู้ใช้งานเข้าสังกัดหน่วยงาน
  async assignUserToOrg(dto: AssignUserDto) {
    // ตรวจสอบว่าผู้ใช้มีตัวตนจริง (เช็คตาราง users)
    const userExists = await this.db.select('users', { user_id: dto.user_id });
    if (userExists.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งานที่ระบุ');
    }

    // ตรวจสอบว่าหน่วยงานมีตัวตนจริง
    await this.findOneOrg(dto.org_id);

    // ตรวจสอบไม่ให้ผู้ใช้งานผูกซ้ำกับหน่วยงานเดิม
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

  // 1.2 แก้ไขสาขาพร้อมหน่วยงานย่อยรวดเดียว (Bulk Upsert & Delete ด้วย Database Transaction)
  async updateBranchWithUnits(dto: UpdateBranchWithUnitsDto) {
    const branchId = dto.branch_id;
    const branchExists = await this.db.select('organizations', { org_id: branchId });
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
      // ขั้นตอน A: อัปเดตชื่อสาขาหลัก และเช็คความซ้ำซ้อนของชื่อสาขาอื่น (ยกเว้นตัวเอง)
      const duplicateCheck = await this.db.queryTx(
        client,
        'SELECT * FROM organizations WHERE org_name = $1 AND parent_id IS NULL AND org_id <> $2',
        [trimmedBranchName, branchId],
      );
      if (duplicateCheck.length > 0) {
        throw new BadRequestException('ชื่อสาขาหลักนี้มีอยู่ในระบบแล้ว');
      }

      await this.db.update(
        'organizations',
        { org_name: trimmedBranchName },
        { org_id: branchId },
        client,
      );

      // ขั้นตอน B: รวบรวม ID แผนกย่อยทั้งหมดที่ถูกส่งมารอบนี้
      const sentUnitIds = dto.units
        .map((u) => u.org_id)
        .filter((id): id is number => typeof id === 'number' && id > 0);

      // ขั้นตอน C: ค้นหาและลบแผนกย่อยเดิมที่ไม่ได้ถูกส่งมาในรอบนี้ (แอดมินกดลบแถวออกจากตาราง)
      let deleteQuery = 'SELECT org_id, org_name FROM organizations WHERE parent_id = $1';
      const deleteQueryParams: any[] = [branchId];
      if (sentUnitIds.length > 0) {
        deleteQuery += ' AND org_id <> ALL($2)';
        deleteQueryParams.push(sentUnitIds);
      }

      const unitsToDelete = await this.db.queryTx(client, deleteQuery, deleteQueryParams);

      for (const u of unitsToDelete) {
        // ตรวจสอบความปลอดภัย: ห้ามลบแผนกย่อยหากยังมีพนักงานผูกสังกัดอยู่ในตาราง user_organizations
        const assignedUsers = await this.db.queryTx(client, 'SELECT * FROM user_organizations WHERE org_id = $1', [u.org_id]);
        if (assignedUsers.length > 0) {
          throw new BadRequestException(
            `ไม่สามารถลบแผนก "${u.org_name}" ได้ เนื่องจากยังมีพนักงานผูกสังกัดอยู่ในแผนกนี้`,
          );
        }
      }

      // ดำเนินการลบแผนกย่อยที่แอดมินลบแถวทิ้ง
      if (unitsToDelete.length > 0) {
        const deleteIds = unitsToDelete.map((u: any) => u.org_id);
        await this.db.queryTx(client, 'DELETE FROM organizations WHERE org_id = ANY($1)', [deleteIds]);
      }

      // ขั้นตอน D: อัปเดตแผนกเดิม หรือสร้างแผนกใหม่เพิ่มเติมตามอาร์เรย์ที่ส่งมา
      const processedUnits = [];
      for (const unit of dto.units) {
        const trimmedUnitName = unit.org_name.trim();
        if (!trimmedUnitName) {
          throw new BadRequestException('ชื่อหน่วยงานย่อย/แผนกไม่สามารถเป็นช่องว่างได้');
        }

        if (unit.org_id) {
          // ตรวจสอบว่าแผนกเดิมนี้สังกัดอยู่ภายใต้สาขานี้จริง เพื่อความปลอดภัยข้อมูล
          const unitRecord = await this.db.queryTx(client, 'SELECT * FROM organizations WHERE org_id = $1', [unit.org_id]);
          if (unitRecord.length === 0 || unitRecord[0].parent_id !== branchId) {
            throw new BadRequestException(`หน่วยงานย่อยรหัส ${unit.org_id} ไม่ได้อยู่ภายใต้สาขาหลักนี้`);
          }

          // อัปเดตข้อมูลแผนกย่อยเดิม
          await this.db.update(
            'organizations',
            { org_name: trimmedUnitName, sort_order: unit.sort_order ?? 0 },
            { org_id: unit.org_id },
            client,
          );
          processedUnits.push({
            org_id: unit.org_id,
            org_name: trimmedUnitName,
            sort_order: unit.sort_order ?? 0,
          });
        } else {
          // สร้างแผนกใหม่เพิ่มเข้ามา
          const newUnit = await this.db.insert(
            'organizations',
            {
              org_name: trimmedUnitName,
              parent_id: branchId,
              sort_order: unit.sort_order ?? 0,
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
    const orgs = await this.db.select('organizations', { org_id: id });
    if (orgs.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลหน่วยงานที่ระบุ');
    }
    return orgs[0];
  }

}
