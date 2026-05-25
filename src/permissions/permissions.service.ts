import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FncDB } from 'src/common/services/fnc-db.service';
import { SyncPermissionsDto, SyncGroupDto } from './dto/sync-permissions.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly db: FncDB) {}

  async getPermissionsTree() {
    // ดึงกลุ่มทั้งหมดที่ Active
    const groups = await this.db.query(
      'SELECT * FROM permission_groups WHERE is_active = 1 ORDER BY sort_order ASC, group_name ASC',
    );
    // ดึงสิทธิ์ทั้งหมดที่ Active
    const permissions = await this.db.query(
      'SELECT * FROM permissions WHERE is_active = 1 ORDER BY p_label ASC',
    );

    // ฟังก์ชันช่วยประกอบ Tree แบบ Recursive
    const buildTree = (parentId: number | null): any[] => {
      return groups
        .filter((g) => g.parent_id === parentId)
        .map((g) => {
          return {
            group_id: g.group_id,
            group_name: g.group_name,
            sort_order: g.sort_order,
            permissions: permissions.filter((p) => p.group_id === g.group_id),
            children: buildTree(g.group_id),
          };
        });
    };

    return buildTree(null);
  }

  async syncPermissions(dto: SyncPermissionsDto) {
    const client = await this.db.startTransaction();
    try {
      // 1. จัดการการลบ (Soft Delete) ก่อน
      if (dto.deleted_groups && dto.deleted_groups.length > 0) {
        for (const id of dto.deleted_groups) {
          // ลบกลุ่มหลัก
          await this.db.update('permission_groups', { is_active: 0 }, { group_id: id }, client);
          // ลบสิทธิ์ลูกที่อยู่ในกลุ่มนี้ (Cascade แบบง่าย 1 ชั้น)
          await this.db.update('permissions', { is_active: 0 }, { group_id: id }, client);
        }
      }

      if (dto.deleted_permissions && dto.deleted_permissions.length > 0) {
        for (const id of dto.deleted_permissions) {
          await this.db.update('permissions', { is_active: 0 }, { permission_id: id }, client);
        }
      }

      // 2. จัดการ Insert หรือ Update แบบ Recursive
      const processGroup = async (group: SyncGroupDto, parentId: number | null) => {
        let currentGroupId = group.group_id;

        // UPDATE ถ้ามี ID
        if (currentGroupId) {
          await this.db.update(
            'permission_groups',
            {
              group_name: group.group_name,
              sort_order: group.sort_order || 0,
              parent_id: parentId,
            },
            { group_id: currentGroupId },
            client,
          );
        } else {
          // INSERT ถ้าไม่มี ID
          const result = await this.db.insert(
            'permission_groups',
            {
              group_name: group.group_name,
              sort_order: group.sort_order || 0,
              parent_id: parentId,
            },
            client,
          );
          currentGroupId = result.group_id;
        }

        // จัดการ Permissions ย่อยของกลุ่มนี้
        if (group.permissions && group.permissions.length > 0) {
          for (const p of group.permissions) {
            if (p.permission_id) {
              await this.db.update(
                'permissions',
                { p_key: p.p_key, p_label: p.p_label, group_id: currentGroupId },
                { permission_id: p.permission_id },
                client,
              );
            } else {
              await this.db.insert(
                'permissions',
                { p_key: p.p_key, p_label: p.p_label, group_id: currentGroupId },
                client,
              );
            }
          }
        }

        // เรียกตัวเองเพื่อวนลูปจัดการกลุ่มลูกต่อ
        if (group.children && group.children.length > 0) {
          for (const child of group.children) {
            await processGroup(child, currentGroupId ?? null);
          }
        }
      };

      // เริ่มทำงานจากกลุ่มระดับนอกสุด
      if (dto.children && dto.children.length > 0) {
        for (const child of dto.children) {
          await processGroup(child, null);
        }
      }

      // 3. ยืนยันการทำงานทั้งหมด
      await this.db.commit(client);
      return { message: 'บันทึกโครงสร้างสิทธิ์ทั้งหมดสำเร็จ (Sync Success)' };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Sync permissions error: ${err.message}`);
      throw new BadRequestException('บันทึกข้อมูลไม่สำเร็จ (อาจมีรหัสสิทธิ์ซ้ำซ้อนกัน)');
    }
  }
}
