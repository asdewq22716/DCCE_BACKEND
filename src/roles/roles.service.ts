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
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly db: FncDB,
    private readonly auditLog: AuditLogService,
  ) {}

  // 1. สร้างบทบาทใหม่
  async create(dto: CreateRoleDto, context?: AuditContext) {
    const trimmedRoleName = dto.role_name.trim().toUpperCase();

    // เช็คชื่อบทบาทซ้ำจากทั้งระบบ (รวมถึงตัวที่โดน Soft Delete เพื่อหลีกเลี่ยง Unique DB constraint)
    const existing = await this.db.query(
      'SELECT * FROM roles WHERE UPPER(role_name) = $1',
      [trimmedRoleName],
    );

    if (existing.length > 0) {
      const role = existing[0];
      // หากตัวเดิมเคยถูก Soft Delete ไว้ (is_active = 0) ให้ทำการชุบชีวิตกลับขึ้นมาและอัปเดตข้อมูล
      if (role.is_active === 0) {
        const client = await this.db.startTransaction();
        try {
          const resurrected = await this.db.update(
            'roles',
            {
              is_active: 1,
              description: dto.description || role.description,
            },
            { role_id: role.role_id },
            client,
          );

          const updatedRole = {
            ...role,
            is_active: 1,
            description: dto.description || role.description,
          };

          await this.auditLog.log(
            client,
            {
              actionType: 'CREATE',
              moduleName: 'roles',
              recordId: role.role_id.toString(),
              oldData: role,
              newData: updatedRole,
              remark: `นำบทบาท "${trimmedRoleName}" ที่เคยถูกลบกลับมาใช้งานใหม่`,
            },
            context,
          );

          await this.db.commit(client);
          return updatedRole;
        } catch (err: any) {
          await this.db.rollback(client);
          this.logger.error(`Resurrect role error: ${err.message}`);
          throw err;
        }
      }
      throw new BadRequestException('ชื่อบทบาทนี้มีอยู่ในระบบแล้ว');
    }

    const client = await this.db.startTransaction();
    try {
      const newRole = await this.db.insert(
        'roles',
        {
          role_name: trimmedRoleName,
          description: dto.description || null,
          role_status: dto.role_status !== undefined ? dto.role_status : 1,
          role_remark: dto.role_remark || null,
          is_active: 1,
        },
        client,
      );

      await this.auditLog.log(
        client,
        {
          actionType: 'CREATE',
          moduleName: 'roles',
          recordId: newRole.role_id.toString(),
          oldData: null,
          newData: newRole,
          remark: `สร้างบทบาทใหม่ "${trimmedRoleName}"`,
        },
        context,
      );

      await this.db.commit(client);
      return newRole;
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Create role error: ${err.message}`);
      throw err;
    }
  }

  // 2. ดึงบทบาททั้งหมด
  async findAll() {
    return await this.db.query(
      'SELECT * FROM roles WHERE is_active = 1 ORDER BY role_name ASC',
    );
  }

  // 3. ดึงบทบาทเดี่ยวตาม ID
  async findOne(id: number) {
    const rows = await this.db.query(
      'SELECT * FROM roles WHERE role_id = $1 AND is_active = 1',
      [id],
    );
    if (rows.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลบทบาทที่ระบุ');
    }
    return rows[0];
  }

  // 4. แก้ไขข้อมูลบทบาท
  async update(id: number, dto: UpdateRoleDto, context?: AuditContext) {
    const oldRole = await this.findOne(id);
    const updateData: any = {};

    if (dto.role_name !== undefined) {
      const trimmedName = dto.role_name.trim().toUpperCase();
      if (trimmedName !== oldRole.role_name) {
        // เช็คชื่อซ้ำ
        const existing = await this.db.query(
          'SELECT * FROM roles WHERE UPPER(role_name) = $1 AND role_id <> $2',
          [trimmedName, id],
        );
        if (existing.length > 0) {
          throw new BadRequestException('ชื่อบทบาทนี้ซ้ำกับบทบาทอื่นในระบบ');
        }
        updateData.role_name = trimmedName;
      }
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.role_status !== undefined) {
      updateData.role_status = dto.role_status;
    }

    if (dto.role_remark !== undefined) {
      updateData.role_remark = dto.role_remark;
    }

    if (Object.keys(updateData).length === 0) {
      return oldRole;
    }

    const client = await this.db.startTransaction();
    try {
      await this.db.update('roles', updateData, { role_id: id }, client);
      const updatedRole = { ...oldRole, ...updateData };

      await this.auditLog.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'roles',
          recordId: id.toString(),
          oldData: oldRole,
          newData: updatedRole,
          remark: `แก้ไขข้อมูลบทบาท "${oldRole.role_name}"`,
        },
        context,
      );

      await this.db.commit(client);
      return updatedRole;
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Update role error: ${err.message}`);
      throw err;
    }
  }

  // 5. ลบบทบาท (Soft Delete)
  async delete(id: number, context?: AuditContext) {
    const role = await this.findOne(id);

    // ป้องกันการลบบทบาทที่มีการใช้งานอยู่ในระบบ (ตาราง user_roles)
    const userRoleCheck = await this.db.query(
      'SELECT COUNT(*)::int AS count FROM user_roles WHERE role_id = $1',
      [id],
    );

    if (userRoleCheck[0].count > 0) {
      throw new BadRequestException(
        `ไม่สามารถลบบทบาทนี้ได้เนื่องจากมีผู้ใช้งานผูกอยู่จำนวน ${userRoleCheck[0].count} คน`,
      );
    }

    const client = await this.db.startTransaction();
    try {
      await this.db.update('roles', { is_active: 0 }, { role_id: id }, client);

      await this.auditLog.log(
        client,
        {
          actionType: 'DELETE',
          moduleName: 'roles',
          recordId: id.toString(),
          oldData: role,
          newData: { ...role, is_active: 0 },
          remark: `ลบบทบาท "${role.role_name}" (Soft Delete)`,
        },
        context,
      );

      await this.db.commit(client);
      return { message: 'ลบบทบาทเรียบร้อยแล้ว' };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Delete role error: ${err.message}`);
      throw err;
    }
  }

  // 6. ดึง Permission IDs ทั้งหมดที่ผูกกับบทบาทนี้
  async getPermissions(roleId: number) {
    const role = await this.findOne(roleId); // เช็คว่าบทบาทมีตัวตนจริงหรือไม่ก่อน

    const rows = await this.db.query(
      `SELECT permission_id 
       FROM role_permissions 
       WHERE role_id = $1`,
      [roleId],
    );

    return {
      role_status: role.role_status,
      role_remark: role.role_remark,
      permissionIds: rows.map((r: any) => r.permission_id)
    };
  }

  // 7. กำหนดความผูกพันของสิทธิ์ให้กับบทบาท (Assign Permissions Matrix)
  async assignPermissions(
    roleId: number,
    dto: AssignPermissionsDto,
    context?: AuditContext,
  ) {
    const role = await this.findOne(roleId);

    // ดึงสิทธิ์เดิมสำหรับทำ Audit Log
    const oldPermissionsData = await this.getPermissions(roleId);

    const updateRoleData: any = {};
    if (dto.role_status !== undefined) updateRoleData.role_status = dto.role_status;
    if (dto.role_remark !== undefined) updateRoleData.role_remark = dto.role_remark;

    const client = await this.db.startTransaction();
    try {
      // ขั้นตอน A1: อัปเดตสถานะและหมายเหตุของ Role (ถ้ามีการส่งมา)
      if (Object.keys(updateRoleData).length > 0) {
        await this.db.update('roles', updateRoleData, { role_id: roleId }, client);
      }

      // ขั้นตอน A2: ลบความสัมพันธ์สิทธิ์เดิมออกทั้งหมด
      await this.db.queryTx(
        client,
        'DELETE FROM role_permissions WHERE role_id = $1',
        [roleId],
      );

      // ขั้นตอน B: เพิ่มความสัมพันธ์สิทธิ์ใหม่ (ถ้ามีส่งมา)
      if (dto.permissionIds && dto.permissionIds.length > 0) {
        for (const permId of dto.permissionIds) {
          // ตรวจสอบว่า permission_id มีจริงในตาราง permissions และยังใช้งานได้
          const permCheck = await this.db.query(
            'SELECT 1 FROM permissions WHERE permission_id = $1 AND is_active = 1',
            [permId],
          );
          if (permCheck.length === 0) {
            throw new BadRequestException(
              `ไม่พบรหัสสิทธิ์ ${permId} ในระบบ หรือรหัสสิทธิ์ดังกล่าวไม่ได้ใช้งานแล้ว`,
            );
          }

          await this.db.insert(
            'role_permissions',
            {
              role_id: roleId,
              permission_id: permId,
            },
            client,
          );
        }
      }

      await this.auditLog.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'role_permissions',
          recordId: roleId.toString(),
          oldData: { 
            permissionIds: oldPermissionsData.permissionIds, 
            role_status: role.role_status, 
            role_remark: role.role_remark 
          },
          newData: { 
            permissionIds: dto.permissionIds, 
            role_status: dto.role_status !== undefined ? dto.role_status : role.role_status,
            role_remark: dto.role_remark !== undefined ? dto.role_remark : role.role_remark 
          },
          remark: `แก้ไขการผูกสิทธิ์และสถานะ สำหรับบทบาท "${role.role_name}" (สิทธิ์ใหม่: ${dto.permissionIds.length} รายการ)`,
        },
        context,
      );

      await this.db.commit(client);
      return { message: 'ผูกสิทธิ์ให้กับบทบาทเรียบร้อยแล้ว' };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Assign permissions error: ${err.message}`);
      throw err;
    }
  }
}
