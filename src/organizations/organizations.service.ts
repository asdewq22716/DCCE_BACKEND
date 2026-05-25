import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FncDB } from 'src/common/services/fnc-db.service';
import {
  AuditLogService,
  AuditContext,
} from 'src/common/services/audit-log.service';
import { FncCustom } from 'src/common/fnc-custom';
import { AssignUserDto } from './dto/assign-user.dto';
import { AssignQueryDto } from './dto/assign-query.dto';
import { OrgAccessDto } from './dto/org-access.dto';
import { CreateBranchWithUnitsDto } from './dto/create-branch-with-units.dto';
import { UpdateBranchWithUnitsDto } from './dto/update-branch-with-units.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDetailDto } from './dto/update-unit-detail.dto';
import { AssignOrgPermissionsDto } from './dto/assign-org-permissions.dto';
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

      // ขั้นตอน B: ลูปบันทึก/อัปเดตหน่วยงานย่อย (level = 2, is_active = 1)
      if (dto.units && dto.units.length > 0) {
        for (const unit of dto.units) {
          const unitExists = await this.db.queryTx(
            client,
            'SELECT * FROM organizations WHERE org_id = $1 AND is_active = 1',
            [unit.org_id],
          );
          if (unitExists.length === 0) {
            throw new NotFoundException(
              `ไม่พบข้อมูลหน่วยงานย่อยรหัส ${unit.org_id}`,
            );
          }

          await this.db.update(
            'organizations',
            {
              parent_id: branch.org_id,
              sort_order: unit.sort_order || 0,
              level: 2,
              updated_at: FncCustom.dateNow(),
            },
            { org_id: unit.org_id },
            client,
          );

          const updatedUnit = await this.db.queryTx(
            client,
            'SELECT * FROM organizations WHERE org_id = $1',
            [unit.org_id],
          );
          insertedUnits.push(updatedUnit[0]);
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
  async findAllBranches(
    id?: number,
  ): Promise<OrganizationType | OrganizationType[]> {
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
             o.unit_data_permissions,
             o.unit_view_climate_index,
             o.unit_view_ghg_emissions,
             o.unit_edit_historical_data,
             o.unit_approve_public_data,
             o.unit_remark,
             COALESCE(COUNT(uo.user_id), 0)::int AS user_count
           FROM organizations o
           LEFT JOIN user_organizations uo ON o.org_id = uo.org_id
           WHERE o.parent_id = $1 AND o.is_active = 1
           GROUP BY o.org_id, o.org_name, o.parent_id, o.sort_order, o.level, o.is_active,
                    o.unit_data_permissions, o.unit_view_climate_index, o.unit_view_ghg_emissions,
                    o.unit_edit_historical_data, o.unit_approve_public_data, o.unit_remark
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
            unit_data_permissions: u.unit_data_permissions,
            unit_view_climate_index: u.unit_view_climate_index,
            unit_view_ghg_emissions: u.unit_view_ghg_emissions,
            unit_edit_historical_data: u.unit_edit_historical_data,
            unit_approve_public_data: u.unit_approve_public_data,
            unit_remark: u.unit_remark,
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
             o.unit_data_permissions,
             o.unit_view_climate_index,
             o.unit_view_ghg_emissions,
             o.unit_edit_historical_data,
             o.unit_approve_public_data,
             o.unit_remark,
             COALESCE(COUNT(uo.user_id), 0)::int AS user_count
           FROM organizations o
           LEFT JOIN user_organizations uo ON o.org_id = uo.org_id
           WHERE o.parent_id IS NOT NULL AND o.is_active = 1
           GROUP BY o.org_id, o.org_name, o.parent_id, o.sort_order, o.level, o.is_active,
                    o.unit_data_permissions, o.unit_view_climate_index, o.unit_view_ghg_emissions,
                    o.unit_edit_historical_data, o.unit_approve_public_data, o.unit_remark
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
              unit_data_permissions: unit.unit_data_permissions,
              unit_view_climate_index: unit.unit_view_climate_index,
              unit_view_ghg_emissions: unit.unit_view_ghg_emissions,
              unit_edit_historical_data: unit.unit_edit_historical_data,
              unit_approve_public_data: unit.unit_approve_public_data,
              unit_remark: unit.unit_remark,
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

  // ========== 7. User Organizations Assignment (ผูกสังกัดผู้ใช้งาน) ==========

  // 7.0 ดึงรายชื่อผู้ใช้งานทั้งหมดพร้อมสังกัดหลัก (สาขา + หน่วยงาน)
  async getUsersAssignmentList(query: AssignQueryDto) {
    try {
      let sql = `
        SELECT
          u.user_id,
          u.full_name,
          u.sso_email AS email,
          org_unit.org_id AS unit_id,
          org_unit.org_name AS unit_name,
          org_branch.org_id AS branch_id,
          org_branch.org_name AS branch_name
        FROM users u
        LEFT JOIN user_organizations uo ON u.user_id = uo.user_id AND uo.is_primary = 1
        LEFT JOIN organizations org_unit ON uo.org_id = org_unit.org_id AND org_unit.is_active = 1
        LEFT JOIN organizations org_branch ON org_unit.parent_id = org_branch.org_id AND org_branch.is_active = 1
        WHERE u.is_active = 1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (query.name) {
        sql += ` AND u.full_name ILIKE $${paramIndex}`;
        params.push(`%${query.name}%`);
        paramIndex++;
      }
      if (query.branch_id) {
        sql += ` AND org_branch.org_id = $${paramIndex}`;
        params.push(parseInt(query.branch_id, 10));
        paramIndex++;
      }
      if (query.unit_id) {
        sql += ` AND org_unit.org_id = $${paramIndex}`;
        params.push(parseInt(query.unit_id, 10));
        paramIndex++;
      }

      sql += ` ORDER BY u.user_id ASC`;

      return await this.db.query(sql, params);
    } catch (err: any) {
      this.logger.error(`Get users assignment list error: ${err.message}`);
      throw new BadRequestException(
        'ไม่สามารถดึงข้อมูลรายชื่อผู้ใช้งานได้',
      );
    }
  }

  // 7.1 ผูกผู้ใช้งานเข้าสังกัดหลัก (is_primary = 1)
  async assignUserToOrg(dto: AssignUserDto, context?: AuditContext) {
    const userExists = await this.db.select('users', { user_id: dto.user_id });
    if (userExists.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งานที่ระบุ');
    }

    await this.findOneOrg(dto.org_id);

    const client = await this.db.startTransaction();

    try {
      // ดึงข้อมูลสังกัดหลักเดิม (ถ้ามี) สำหรับ audit log
      const oldPrimary = await this.db.queryTx(
        client,
        `SELECT uo.*, o.org_name
         FROM user_organizations uo
         LEFT JOIN organizations o ON uo.org_id = o.org_id
         WHERE uo.user_id = $1 AND uo.is_primary = 1`,
        [dto.user_id],
      );

      // ลบสังกัดหลักเดิม (ถ้ามี)
      if (oldPrimary.length > 0) {
        await this.db.queryTx(
          client,
          'DELETE FROM user_organizations WHERE user_id = $1 AND is_primary = 1',
          [dto.user_id],
        );
      }

      // ตรวจสอบว่ามี record อยู่แล้วหรือไม่ (อาจเป็น access เดิม is_primary = 0)
      const existingAccess = await this.db.queryTx(
        client,
        'SELECT * FROM user_organizations WHERE user_id = $1 AND org_id = $2',
        [dto.user_id, dto.org_id],
      );

      if (existingAccess.length > 0) {
        // ถ้ามี access อยู่แล้ว ให้อัปเกรดเป็น primary
        await this.db.queryTx(
          client,
          'UPDATE user_organizations SET is_primary = 1 WHERE user_id = $1 AND org_id = $2',
          [dto.user_id, dto.org_id],
        );
      } else {
        // ถ้ายังไม่มี ให้ insert ใหม่
        await this.db.queryTx(
          client,
          'INSERT INTO user_organizations (user_id, org_id, is_primary) VALUES ($1, $2, 1)',
          [dto.user_id, dto.org_id],
        );
      }

      // ดึงข้อมูลสังกัดใหม่สำหรับ audit log
      const newPrimary = await this.db.queryTx(
        client,
        `SELECT uo.*, o.org_name
         FROM user_organizations uo
         LEFT JOIN organizations o ON uo.org_id = o.org_id
         WHERE uo.user_id = $1 AND uo.is_primary = 1`,
        [dto.user_id],
      );

      // บันทึก audit log
      await this.auditLog.log(
        client,
        {
          actionType: oldPrimary.length > 0 ? 'UPDATE' : 'CREATE',
          moduleName: 'user_organizations',
          recordId: dto.user_id.toString(),
          oldData: oldPrimary.length > 0 ? oldPrimary[0] : null,
          newData: newPrimary[0],
          remark: dto.remark || undefined,
        },
        context,
      );

      await this.db.commit(client);

      return {
        message: 'กำหนดสังกัดหลักเรียบร้อยแล้ว',
        user_id: dto.user_id,
        org_id: dto.org_id,
      };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Assign user to organization error: ${err.message}`);
      throw err;
    }
  }

  // 7.2 ถอดถอนผู้ใช้งานออกจากสังกัดหลัก (is_primary = 1)
  async removeUserFromOrg(dto: AssignUserDto, context?: AuditContext) {
    const client = await this.db.startTransaction();

    try {
      // ดึงข้อมูลเดิมก่อนลบ
      const existing = await this.db.queryTx(
        client,
        `SELECT uo.*, o.org_name
         FROM user_organizations uo
         LEFT JOIN organizations o ON uo.org_id = o.org_id
         WHERE uo.user_id = $1 AND uo.org_id = $2 AND uo.is_primary = 1`,
        [dto.user_id, dto.org_id],
      );

      if (existing.length === 0) {
        throw new NotFoundException(
          'ไม่พบข้อมูลสังกัดหลักของผู้ใช้ในหน่วยงานที่ระบุ',
        );
      }

      await this.db.queryTx(
        client,
        'DELETE FROM user_organizations WHERE user_id = $1 AND org_id = $2 AND is_primary = 1',
        [dto.user_id, dto.org_id],
      );

      // บันทึก audit log
      await this.auditLog.log(
        client,
        {
          actionType: 'DELETE',
          moduleName: 'user_organizations',
          recordId: dto.user_id.toString(),
          oldData: existing[0],
          newData: null,
          remark: dto.remark || 'ถอดถอนสังกัดหลัก',
        },
        context,
      );

      await this.db.commit(client);
      return { message: 'ถอดถอนผู้ใช้งานออกจากสังกัดหลักเรียบร้อยแล้ว' };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Remove user from organization error: ${err.message}`);
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(
        'ไม่สามารถดำเนินการถอดถอนผู้ใช้งานออกจากหน่วยงานได้',
      );
    }
  }

  // 7.3 ดึงประวัติการย้ายสังกัดหลักของผู้ใช้งาน
  async getUserAssignmentHistory(userId: number) {
    try {
      const userExists = await this.db.select('users', { user_id: userId });
      if (userExists.length === 0) {
        throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งานที่ระบุ');
      }

      const history = await this.db.query(
        `SELECT
          log_id,
          action_type,
          old_data,
          new_data,
          remark,
          created_by,
          created_at
        FROM audit_logs
        WHERE module_name = 'user_organizations' AND record_id = $1
        ORDER BY created_at DESC`,
        [userId.toString()],
      );
      return history;
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(
        `Get user assignment history error: ${err.message}`,
      );
      throw new BadRequestException(
        'ไม่สามารถดึงประวัติการย้ายสังกัดได้',
      );
    }
  }

  // ========== 8. Organization Access (สิทธิ์เข้าถึงองค์กรเพิ่มเติม) ==========

  // 8.1 เพิ่มสิทธิ์เข้าถึงองค์กรเพิ่มเติม (is_primary = 0)
  async addOrgAccess(dto: OrgAccessDto, context?: AuditContext) {
    const userExists = await this.db.select('users', { user_id: dto.user_id });
    if (userExists.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งานที่ระบุ');
    }

    await this.findOneOrg(dto.org_id);

    // ตรวจสอบว่ามีอยู่แล้วหรือไม่ (ทั้ง primary และ access)
    const existing = await this.db.query(
      'SELECT * FROM user_organizations WHERE user_id = $1 AND org_id = $2',
      [dto.user_id, dto.org_id],
    );
    if (existing.length > 0) {
      if (existing[0].is_primary === 1) {
        throw new BadRequestException(
          'หน่วยงานนี้เป็นสังกัดหลักของผู้ใช้งานอยู่แล้ว',
        );
      }
      throw new BadRequestException(
        'ผู้ใช้งานมีสิทธิ์เข้าถึงหน่วยงานนี้อยู่แล้ว',
      );
    }

    const client = await this.db.startTransaction();

    try {
      await this.db.queryTx(
        client,
        'INSERT INTO user_organizations (user_id, org_id, is_primary) VALUES ($1, $2, 0)',
        [dto.user_id, dto.org_id],
      );

      await this.auditLog.log(
        client,
        {
          actionType: 'CREATE',
          moduleName: 'user_org_access',
          recordId: dto.user_id.toString(),
          oldData: null,
          newData: { user_id: dto.user_id, org_id: dto.org_id, is_primary: 0 },
          remark: dto.remark || 'เพิ่มสิทธิ์เข้าถึงหน่วยงาน',
        },
        context,
      );

      await this.db.commit(client);

      return {
        message: 'เพิ่มสิทธิ์เข้าถึงหน่วยงานเรียบร้อยแล้ว',
        user_id: dto.user_id,
        org_id: dto.org_id,
      };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Add org access error: ${err.message}`);
      throw err;
    }
  }

  // 8.2 ดึงรายการองค์กรที่ผู้ใช้มีสิทธิ์เข้าถึงเพิ่มเติม (is_primary = 0)
  async getUserOrgAccess(userId: number) {
    try {
      const userExists = await this.db.select('users', { user_id: userId });
      if (userExists.length === 0) {
        throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งานที่ระบุ');
      }

      const accessList = await this.db.query(
        `SELECT
          uo.org_id,
          uo.is_primary,
          o.org_name,
          o.parent_id,
          o.level,
          parent_org.org_name AS branch_name,
          parent_org.org_id AS branch_id
        FROM user_organizations uo
        JOIN organizations o ON uo.org_id = o.org_id AND o.is_active = 1
        LEFT JOIN organizations parent_org ON o.parent_id = parent_org.org_id AND parent_org.is_active = 1
        WHERE uo.user_id = $1 AND uo.is_primary = 0
        ORDER BY o.org_id ASC`,
        [userId],
      );

      return accessList;
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Get user org access error: ${err.message}`);
      throw new BadRequestException(
        'ไม่สามารถดึงข้อมูลสิทธิ์เข้าถึงหน่วยงานเพิ่มเติมได้',
      );
    }
  }

  // 8.3 ถอนสิทธิ์เข้าถึงองค์กรเพิ่มเติม (is_primary = 0)
  async removeOrgAccess(dto: OrgAccessDto, context?: AuditContext) {
    const client = await this.db.startTransaction();

    try {
      const existing = await this.db.queryTx(
        client,
        `SELECT uo.*, o.org_name
         FROM user_organizations uo
         LEFT JOIN organizations o ON uo.org_id = o.org_id
         WHERE uo.user_id = $1 AND uo.org_id = $2 AND uo.is_primary = 0`,
        [dto.user_id, dto.org_id],
      );

      if (existing.length === 0) {
        throw new NotFoundException(
          'ไม่พบข้อมูลสิทธิ์เข้าถึงเพิ่มเติมที่ต้องการถอน',
        );
      }

      await this.db.queryTx(
        client,
        'DELETE FROM user_organizations WHERE user_id = $1 AND org_id = $2 AND is_primary = 0',
        [dto.user_id, dto.org_id],
      );

      await this.auditLog.log(
        client,
        {
          actionType: 'DELETE',
          moduleName: 'user_org_access',
          recordId: dto.user_id.toString(),
          oldData: existing[0],
          newData: null,
          remark: dto.remark || 'ถอนสิทธิ์เข้าถึงหน่วยงาน',
        },
        context,
      );

      await this.db.commit(client);
      return { message: 'ถอนสิทธิ์เข้าถึงหน่วยงานเรียบร้อยแล้ว' };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Remove org access error: ${err.message}`);
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(
        'ไม่สามารถดำเนินการถอนสิทธิ์เข้าถึงหน่วยงานได้',
      );
    }
  }

  // ==========================================
  // 📂 9. Organization Permissions (ฟังก์ชันการใช้งานขององค์กร)
  // ==========================================

  // 9.1 ดึงฟังก์ชันการใช้งานทั้งหมดขององค์กร
  async getOrganizationPermissions(orgId: number) {
    // ตรวจสอบว่าองค์กรมีอยู่จริง
    await this.findOneOrg(orgId);

    const records = await this.db.query(
      'SELECT permission_id FROM organization_permissions WHERE org_id = $1',
      [orgId]
    );

    const permission_ids = records.map((r: any) => r.permission_id);

    return {
      org_id: orgId,
      permission_ids,
    };
  }

  // 9.2 บันทึก/อัปเดตฟังก์ชันการใช้งานขององค์กร (แทนที่ของเดิมทั้งหมด)
  async assignOrganizationPermissions(
    orgId: number,
    dto: AssignOrgPermissionsDto,
    context?: AuditContext,
  ) {
    // ตรวจสอบว่าองค์กรมีอยู่จริง
    const org = await this.findOneOrg(orgId);

    const client = await this.db.startTransaction();

    try {
      // 0. อัปเดตข้อมูลการตั้งค่าสิทธิ์ที่ระดับหน่วยงาน (is_active, remark)
      const updateData: any = {};
      if (dto.is_active !== undefined) {
        updateData.permission_is_active = dto.is_active;
      }
      if (dto.remark !== undefined) {
        updateData.permission_remark = dto.remark;
      }

      if (Object.keys(updateData).length > 0) {
        await this.db.update('organizations', updateData, { org_id: orgId }, client);
      }

      // 1. ดึงข้อมูลเดิมสำหรับ Audit Log
      const oldRecords = await this.db.queryTx(
        client,
        'SELECT permission_id FROM organization_permissions WHERE org_id = $1',
        [orgId]
      );
      const oldPermissionIds = oldRecords.map((r: any) => r.permission_id);

      // 2. ลบฟังก์ชันเดิมทั้งหมดขององค์กรนี้
      await this.db.queryTx(
        client,
        'DELETE FROM organization_permissions WHERE org_id = $1',
        [orgId],
      );

      // 3. เพิ่มฟังก์ชันใหม่เข้าไป (Bulk Insert)
      if (dto.permission_ids && dto.permission_ids.length > 0) {
        // กรองเอาเฉพาะ ID ที่ไม่ซ้ำกันเพื่อป้องกัน error ตอน insert
        const uniqueIds = Array.from(new Set(dto.permission_ids));
        
        const values = [];
        const params = [];
        let paramIndex = 1;

        for (const pId of uniqueIds) {
          values.push(`($${paramIndex}, $${paramIndex + 1})`);
          params.push(orgId, pId);
          paramIndex += 2;
        }

        const query = `
          INSERT INTO organization_permissions (org_id, permission_id)
          VALUES ${values.join(', ')}
        `;
        await this.db.queryTx(client, query, params);
      }

      // 4. บันทึก Audit Log
      await this.auditLog.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'organization_permissions',
          recordId: orgId.toString(),
          oldData: { org_id: orgId, permission_ids: oldPermissionIds },
          newData: { org_id: orgId, permission_ids: dto.permission_ids || [], is_active: dto.is_active, remark: dto.remark },
          remark: `อัปเดตฟังก์ชันการใช้งานให้หน่วยงาน "${org.org_name}"`,
        },
        context,
      );

      await this.db.commit(client);

      return {
        message: 'อัปเดตฟังก์ชันการใช้งานของหน่วยงานเรียบร้อยแล้ว',
        org_id: orgId,
        permission_ids: dto.permission_ids || [],
        is_active: dto.is_active,
        remark: dto.remark
      };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Assign org permissions error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถอัปเดตฟังก์ชันการใช้งานของหน่วยงานได้');
    }
  }

  // 1.2 แก้ไขสาขาพร้อมหน่วยงานย่อยรวดเดียว (Bulk Upsert & Delete)
  async updateBranchWithUnits(
    dto: UpdateBranchWithUnitsDto,
    context?: AuditContext,
  ) {
    const branchId = dto.branch_id;
    const branchExists = await this.db.select('organizations', {
      org_id: branchId,
      is_active: 1,
    });
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
          updated_at: FncCustom.dateNow(),
        },
        { org_id: branchId },
        client,
      );

      // ขั้นตอน B: อัปเดตหน่วยงานย่อย (หากมีการส่งมา)
      const processedUnits = [];
      if (dto.units && dto.units.length > 0) {
        for (const unit of dto.units) {
          const unitRecord = await this.db.queryTx(
            client,
            'SELECT * FROM organizations WHERE org_id = $1',
            [unit.org_id],
          );
          if (unitRecord.length === 0) {
            throw new NotFoundException(
              `ไม่พบข้อมูลหน่วยงานย่อยรหัส ${unit.org_id}`,
            );
          }
          if (unitRecord[0].org_id === branchId) {
            throw new BadRequestException(
              `ไม่สามารถจัดหน่วยงานย่อยให้เป็นตัวสาขาหลักเองได้`,
            );
          }

          // ตรวจสอบความปลอดภัยกรณีสั่งปิดใช้งาน/ลบ (is_active = 0)
          const targetIsActive = unit.is_active ?? unitRecord[0].is_active;
          if (targetIsActive === 0 && unitRecord[0].is_active === 1) {
            const assignedUsers = await this.db.queryTx(
              client,
              'SELECT * FROM user_organizations WHERE org_id = $1',
              [unit.org_id],
            );
            if (assignedUsers.length > 0) {
              throw new BadRequestException(
                `ไม่สามารถปิดใช้งานแผนก "${unitRecord[0].org_name}" ได้ เนื่องจากยังมีพนักงานผูกสังกัดอยู่`,
              );
            }
          }

          await this.db.update(
            'organizations',
            {
              parent_id: branchId,
              sort_order: unit.sort_order ?? unitRecord[0].sort_order,
              is_active: targetIsActive,
              level: 2,
              updated_at: FncCustom.dateNow(),
            },
            { org_id: unit.org_id },
            client,
          );

          processedUnits.push({
            org_id: unit.org_id,
            org_name: unitRecord[0].org_name,
            parent_id: branchId,
            sort_order: unit.sort_order ?? unitRecord[0].sort_order,
            level: 2,
            is_active: targetIsActive,
          });
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
    const orgs = await this.db.select('organizations', {
      org_id: id,
      is_active: 1,
    });
    if (orgs.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลหน่วยงานที่ระบุ');
    }
    return orgs[0];
  }

  // 1.3 ลบสาขาหลักพร้อมแผนกย่อยทั้งหมดภายใต้สาขานั้น (Soft Delete ด้วย Database Transaction)
  async deleteBranch(id: number, context?: AuditContext) {
    const branchExists = await this.db.select('organizations', {
      org_id: id,
      is_active: 1,
    });
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

  // 1.4 สร้างหน่วยงานย่อยแบบเดี่ยว
  async createUnit(
    dto: CreateUnitDto,
    context?: AuditContext,
  ): Promise<OrganizationType> {
    const trimmedUnitName = dto.org_name.trim();
    if (!trimmedUnitName) {
      throw new BadRequestException('ชื่อหน่วยงานย่อยไม่สามารถเป็นช่องว่างได้');
    }

    // ตรวจสอบความซ้ำซ้อนในกลุ่มระดับเดียวกัน (level = 2, is_active = 1)
    const existingUnit = await this.db.query(
      'SELECT * FROM organizations WHERE org_name = $1 AND level = 2 AND is_active = 1',
      [trimmedUnitName],
    );
    if (existingUnit.length > 0) {
      throw new BadRequestException('ชื่อหน่วยงานย่อยนี้มีอยู่ในระบบแล้ว');
    }

    const client = await this.db.startTransaction();

    try {
      const unit = await this.db.insert(
        'organizations',
        {
          org_name: trimmedUnitName,
          parent_id: dto.parent_id || null,
          sort_order: dto.sort_order || 0,
          level: 2,
          is_active: 1,
          unit_data_permissions: dto.unit_data_permissions ?? null,
          unit_view_climate_index: dto.unit_view_climate_index ?? null,
          unit_view_ghg_emissions: dto.unit_view_ghg_emissions ?? null,
          unit_edit_historical_data: dto.unit_edit_historical_data ?? null,
          unit_approve_public_data: dto.unit_approve_public_data ?? null,
          unit_remark: dto.unit_remark ?? null,
        },
        client,
      );

      // บันทึก Log
      await this.auditLog.log(
        client,
        {
          actionType: 'CREATE',
          moduleName: 'organizations',
          recordId: unit.org_id.toString(),
          oldData: null,
          newData: unit,
          remark: `สร้างหน่วยงานย่อย "${trimmedUnitName}" สำเร็จ`,
        },
        context,
      );

      await this.db.commit(client);
      return unit;
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Create unit error: ${err.message}`);
      throw err;
    }
  }

  // 1.5 แก้ไขข้อมูลหน่วยงานย่อยแบบเดี่ยว
  /**
   * แก้ไขข้อมูลหน่วยงานย่อยแบบเดี่ยว
   * @param id รหัสของหน่วยงานย่อยที่ต้องการอัปเดต (org_id)
   * @param dto ข้อมูลฟิลด์ต่างๆ ที่ส่งมาอัปเดต (เช่น ชื่อ, ลำดับ, สิทธิ์การใช้งาน, หมายเหตุ)
   * @param context ข้อมูลบริบทผู้ใช้งาน (User ID, IP, User Agent) เพื่อนำไปบันทึก Audit Log ประวัติการทำงาน
   */
  async updateUnit(
    id: number,
    dto: UpdateUnitDetailDto,
    context?: AuditContext,
  ): Promise<any> {
    const unitRecord = await this.db.select('organizations', { org_id: id });
    if (unitRecord.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลหน่วยงานย่อยที่ระบุ');
    }

    let trimmedUnitName = unitRecord[0].org_name;
    if (dto.org_name !== undefined) {
      trimmedUnitName = dto.org_name.trim();
      if (!trimmedUnitName) {
        throw new BadRequestException(
          'ชื่อหน่วยงานย่อยไม่สามารถเป็นช่องว่างได้',
        );
      }

      // เช็คชื่อซ้ำกรณีเปลี่ยนชื่อ
      const duplicateCheck = await this.db.query(
        'SELECT * FROM organizations WHERE org_name = $1 AND level = 2 AND org_id <> $2 AND is_active = 1',
        [trimmedUnitName, id],
      );
      if (duplicateCheck.length > 0) {
        throw new BadRequestException('ชื่อหน่วยงานย่อยนี้มีอยู่ในระบบแล้ว');
      }
    }

    const client = await this.db.startTransaction();

    try {
      // ตรวจสอบความปลอดภัยกรณีสั่งปิดใช้งาน/ลบ (is_active = 0)
      const targetIsActive = dto.is_active ?? unitRecord[0].is_active;
      if (targetIsActive === 0 && unitRecord[0].is_active === 1) {
        const assignedUsers = await this.db.queryTx(
          client,
          'SELECT * FROM user_organizations WHERE org_id = $1',
          [id],
        );
        if (assignedUsers.length > 0) {
          throw new BadRequestException(
            `ไม่สามารถปิดใช้งานแผนก "${trimmedUnitName}" ได้ เนื่องจากยังมีพนักงานผูกสังกัดอยู่`,
          );
        }
      }

      const existing = unitRecord[0];
      const updateFields = {
        org_name: trimmedUnitName,
        parent_id: dto.parent_id ?? existing.parent_id,
        sort_order: dto.sort_order ?? existing.sort_order,
        is_active: targetIsActive,
        unit_data_permissions: dto.unit_data_permissions ?? existing.unit_data_permissions,
        unit_view_climate_index: dto.unit_view_climate_index ?? existing.unit_view_climate_index,
        unit_view_ghg_emissions: dto.unit_view_ghg_emissions ?? existing.unit_view_ghg_emissions,
        unit_edit_historical_data: dto.unit_edit_historical_data ?? existing.unit_edit_historical_data,
        unit_approve_public_data: dto.unit_approve_public_data ?? existing.unit_approve_public_data,
        unit_remark: dto.unit_remark ?? existing.unit_remark,
        updated_at: FncCustom.dateNow(),
      };

      await this.db.update(
        'organizations',
        updateFields,
        { org_id: id },
        client,
      );

      const updated = await this.db.queryTx(
        client,
        'SELECT * FROM organizations WHERE org_id = $1',
        [id],
      );

      // บันทึก Log
      await this.auditLog.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'organizations',
          recordId: id.toString(),
          oldData: unitRecord[0],
          newData: updated[0],
          remark: `แก้ไขหน่วยงานย่อย "${trimmedUnitName}"`,
        },
        context,
      );

      await this.db.commit(client);
      return updated[0];
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Update unit error: ${err.message}`);
      throw err;
    }
  }

  // 1.6 ดึงข้อมูลหน่วยงานย่อยทั้งหมด
  async findAllUnits(): Promise<OrganizationType[]> {
    try {
      const units = await this.db.query(
        `SELECT org_id, org_name, parent_id, sort_order, level, is_active,
                unit_data_permissions, unit_view_climate_index, unit_view_ghg_emissions,
                unit_edit_historical_data, unit_approve_public_data, unit_remark
         FROM organizations
         WHERE level = 2 AND is_active = 1
         ORDER BY org_id ASC`,
      );
      return units;
    } catch (err: any) {
      this.logger.error(`Find all units error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถดึงข้อมูลหน่วยงานย่อยได้');
    }
  }
}
