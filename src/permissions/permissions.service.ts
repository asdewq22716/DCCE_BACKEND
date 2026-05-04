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
       WHERE p.is_active = 1
       ORDER BY pg.sort_order ASC, pg.group_name ASC, p.p_label ASC`
    );
  }

  async deletePermission(permissionId: number) {
    const updated = await this.db.update('permissions', 
      { is_active: 0 }, 
      { permission_id: permissionId }
    );
    if (updated === 0) throw new NotFoundException('ไม่พบสิทธิ์ที่ต้องการลบ');
    return { message: 'ลบสิทธิ์เรียบร้อยแล้ว (Soft Delete)' };
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
    return await this.db.query('SELECT * FROM permission_groups WHERE is_active = 1 ORDER BY sort_order ASC, group_name ASC');
  }

  async deleteGroup(groupId: number) {
    // เช็คก่อนว่ามีสิทธิ์ที่ยังใช้งานอยู่ภายใต้กลุ่มนี้ไหม
    const perms = await this.db.select('permissions', { group_id: groupId, is_active: 1 });
    if (perms.length > 0) throw new BadRequestException('ไม่สามารถลบกลุ่มที่มีสิทธิ์การใช้งานอยู่ได้');

    const updated = await this.db.update('permission_groups', 
      { is_active: 0 }, 
      { group_id: groupId }
    );
    if (updated === 0) throw new NotFoundException('ไม่พบกลุ่มที่ต้องการลบ');
    return { message: 'ลบกลุ่มสิทธิ์เรียบร้อยแล้ว (Soft Delete)' };
  }
}
