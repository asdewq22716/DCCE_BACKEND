import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { FncDB } from 'src/common/services/fnc-db.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreatePermissionGroupDto } from './dto/create-permission-group.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly db: FncDB) { }

  // ---------- Permissions Management ----------

  async createPermission(dto: CreatePermissionDto) {
    try {
      return await this.db.insert('permissions', dto);
    } catch (err: any) {
      this.logger.error(`Create permission error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถสร้างสิทธิ์ได้ (อาจมีรหัสสิทธิ์นี้อยู่แล้ว)');
    }
  }

  async getAllPermissions() {
    return await this.db.query(
      `SELECT p.*, pg.group_name 
       FROM permissions p
       LEFT JOIN permission_groups pg ON p.group_id = pg.group_id
       ORDER BY pg.sort_order ASC, p.p_label ASC`
    );
  }

  async deletePermission(permissionId: number) {
    const deleted = await this.db.delete('permissions', { permission_id: permissionId });
    if (deleted === 0) throw new NotFoundException('ไม่พบสิทธิ์ที่ต้องการลบ');
    return { message: 'ลบสิทธิ์เรียบร้อยแล้ว' };
  }

  // ---------- Permission Groups Management ----------

  async createGroup(dto: CreatePermissionGroupDto) {
    try {
      return await this.db.insert('permission_groups', dto);
    } catch (err: any) {
      this.logger.error(`Create group error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถสร้างกลุ่มสิทธิ์ได้ (ชื่อกลุ่มอาจซ้ำ)');
    }
  }

  async getAllGroups() {
    return await this.db.query('SELECT * FROM permission_groups ORDER BY sort_order ASC');
  }

  async deleteGroup(groupId: number) {
    // เช็คก่อนว่ามีสิทธิ์ภายใต้กลุ่มนี้ไหม
    const perms = await this.db.select('permissions', { group_id: groupId });
    if (perms.length > 0) throw new BadRequestException('ไม่สามารถลบกลุ่มที่มีสิทธิ์การใช้งานอยู่ได้');

    const deleted = await this.db.delete('permission_groups', { group_id: groupId });
    if (deleted === 0) throw new NotFoundException('ไม่พบกลุ่มที่ต้องการลบ');
    return { message: 'ลบกลุ่มสิทธิ์เรียบร้อยแล้ว' };
  }

  // ---------- Role Permissions ----------

  async assignPermissionToRole(roleId: number, permissionId: number) {
    try {
      return await this.db.insert('role_permissions', {
        role_id: roleId,
        permission_id: permissionId,
      });
    } catch (err: any) {
      this.logger.error(`Assign permission to role error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถมอบสิทธิ์ให้บทบาทได้ (อาจมีสิทธิ์นี้อยู่แล้ว)');
    }
  }

  async removePermissionFromRole(roleId: number, permissionId: number) {
    const deleted = await this.db.delete('role_permissions', {
      role_id: roleId,
      permission_id: permissionId,
    });
    if (deleted === 0) throw new NotFoundException('ไม่พบสิทธิ์ในบทบาทที่ระบุ');
    return { message: 'ถอนสิทธิ์จากบทบาทเรียบร้อยแล้ว' };
  }

  // ---------- User Permissions (Special) ----------

  async assignPermissionToUser(userId: number, permission_id: number, isDeny: boolean = false, expiredAt?: Date, remark?: string) {
    try {
      return await this.db.insert('user_permissions', {
        user_id: userId,
        permission_id: permission_id,
        is_deny: isDeny,
        expired_at: expiredAt,
        remark: remark,
      });
    } catch (err: any) {
      this.logger.error(`Assign permission to user error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถมอบสิทธิ์พิเศษให้ผู้ใช้ได้ (อาจมีสิทธิ์นี้อยู่แล้ว)');
    }
  }

  async removePermissionFromUser(userId: number, permissionId: number) {
    const deleted = await this.db.delete('user_permissions', {
      user_id: userId,
      permission_id: permissionId,
    });
    if (deleted === 0) throw new NotFoundException('ไม่พบสิทธิ์พิเศษในผู้ใช้ที่ระบุ');
    return { message: 'ถอนสิทธิ์พิเศษเรียบร้อยแล้ว' };
  }

  // ---------- Get Combined Permissions ----------

  async getEffectivePermissions(userId: number) {
    try {
      // 1. Get permissions from roles
      const rolePerms = await this.db.query(
        `SELECT DISTINCT p.*, pg.group_name FROM permissions p
         JOIN role_permissions rp ON p.permission_id = rp.permission_id
         JOIN user_roles ur ON rp.role_id = ur.role_id
         LEFT JOIN permission_groups pg ON p.group_id = pg.group_id
         WHERE ur.user_id = $1`,
        [userId]
      );

      // 2. Get special user permissions (not expired)
      const specialPerms = await this.db.query(
        `SELECT p.*, pg.group_name, up.is_deny FROM permissions p
         JOIN user_permissions up ON p.permission_id = up.permission_id
         LEFT JOIN permission_groups pg ON p.group_id = pg.group_id
         WHERE up.user_id = $1 
         AND (up.expired_at IS NULL OR up.expired_at > CURRENT_TIMESTAMP)`,
        [userId]
      );

      // Separate Grants and Denies
      const grantedSpecial = specialPerms.filter(p => !p.is_deny);
      const deniedSpecialIds = new Set(specialPerms.filter(p => p.is_deny).map(p => p.permission_id));

      // Combine role perms and granted special perms
      const allPermsMap = new Map();
      [...rolePerms, ...grantedSpecial].forEach(p => {
        // Only add if not explicitly denied
        if (!deniedSpecialIds.has(p.permission_id)) {
          allPermsMap.set(p.permission_id, p);
        }
      });

      return Array.from(allPermsMap.values());
    } catch (err: any) {
      this.logger.error(`Get effective permissions error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถดึงข้อมูลสิทธิ์การใช้งานได้');
    }
  }
}
