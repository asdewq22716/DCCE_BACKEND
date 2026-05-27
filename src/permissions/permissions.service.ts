import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FncDB } from 'src/common/services/fnc-db.service';
import { AuditLogService, AuditContext } from 'src/common/services/audit-log.service';
import { SyncPermissionsDto, SyncGroupDto } from './dto/sync-permissions.dto';
import { BulkUpdateUserOrgPermissionsDto } from './dto/user-org-permissions.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    private readonly db: FncDB,
    private readonly auditLog: AuditLogService,
  ) {}

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

  async getUserAllOrgPermissions(userId: number) {
    // ดึงข้อมูล override ทั้งหมดของ user นี้เฉพาะที่อนุญาต (is_deny = 0)
    const overridePermissions = await this.db.query(
      'SELECT org_id, permission_id FROM user_permissions WHERE user_id = $1 AND is_deny = 0',
      [userId],
    );

    // Group สิทธิ์แยกตามหน่วยงาน (org_id)
    const grouped = overridePermissions.reduce((acc: any, curr: any) => {
      if (!acc[curr.org_id]) {
        acc[curr.org_id] = [];
      }
      acc[curr.org_id].push(curr.permission_id);
      return acc;
    }, {});

    return Object.keys(grouped).map((orgId) => ({
      org_id: parseInt(orgId),
      permissions: grouped[orgId],
    }));
  }

  async getUserOrgPermissions(userId: number, orgId: number) {
    // 1. เช็คว่ามีข้อมูล override สำหรับ user_id และ org_id นี้ใน user_permissions หรือไม่
    const overridePermissions = await this.db.query(
      'SELECT permission_id, is_deny FROM user_permissions WHERE user_id = $1 AND org_id = $2',
      [userId, orgId],
    );

    if (overridePermissions.length > 0) {
      // ดึงเฉพาะที่ติ๊กถูก (is_deny = 0) ไปโชว์หน้าจอ
      const granted = overridePermissions
        .filter((p: any) => p.is_deny === 0)
        .map((p: any) => p.permission_id);
      return {
        is_override: true,
        permissions: granted,
      };
    }

    // 2. ถ้าไม่มีข้อมูล ให้ดึงค่า default ของหน่วยงานมาแทน
    const defaultPermissions = await this.db.query(
      'SELECT permission_id FROM organization_permissions WHERE org_id = $1',
      [orgId],
    );

    return {
      is_override: false,
      permissions: defaultPermissions.map((p: any) => p.permission_id),
    };
  }

  async saveAllUserOrgPermissions(userId: number, dto: BulkUpdateUserOrgPermissionsDto, context?: AuditContext) {
    const client = await this.db.startTransaction();
    try {
      // 0. อัปเดตสถานะการใช้งานและหมายเหตุในตาราง users ถ้ามีการส่งมา
      if (dto.permission_status !== undefined || dto.permission_remark !== undefined) {
        const updateData: any = {};
        if (dto.permission_status !== undefined) updateData.permission_status = dto.permission_status;
        if (dto.permission_remark !== undefined) updateData.permission_remark = dto.permission_remark;
        
        await this.db.update('users', updateData, { user_id: userId }, client);
      }

      // 1. ดึงสิทธิ์ทั้งหมดที่มีในระบบ เพื่อเอามาเซ็ตค่า is_deny
      const allPermissionsResult = await this.db.query('SELECT permission_id FROM permissions WHERE is_active = 1');
      const allPermissions = allPermissionsResult.map((p: any) => p.permission_id);

      // 2. Loop วนทีละหน่วยงานที่ส่งมาเพื่อบันทึก
      for (const item of dto.orgPermissions) {
        const orgId = item.org_id;
        const permissionIds = item.permissionIds || [];

        // ลบข้อมูลเดิมของ User ใน Org นี้ทั้งหมด
        await this.db.delete('user_permissions', { user_id: userId, org_id: orgId }, client);

        // Insert ข้อมูลใหม่ทั้งหมด (อันไหนถูกเลือกให้ is_deny=0, อันไหนไม่ถูกเลือกให้ is_deny=1)
        for (const pid of allPermissions) {
          const isDeny = permissionIds.includes(pid) ? 0 : 1;
          await this.db.insert(
            'user_permissions',
            {
              user_id: userId,
              org_id: orgId,
              permission_id: pid,
              is_deny: isDeny,
            },
            client,
          );
        }
      }

      await this.auditLog.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'user_permissions',
          recordId: userId.toString(),
          oldData: null,
          newData: {
            permission_status: dto.permission_status,
            permission_remark: dto.permission_remark,
            orgPermissions: dto.orgPermissions,
          },
          remark: `กำหนดสิทธิ์การใช้งานรายบุคคล (Override) จำนวน ${dto.orgPermissions.length} หน่วยงาน`,
        },
        context,
      );

      await this.db.commit(client);
      return { message: 'บันทึกสิทธิ์ทุกหน่วยงานสำเร็จ' };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Error saving user org permissions: ${err.message}`);
      throw new BadRequestException('ไม่สามารถบันทึกสิทธิ์ได้ กรุณาลองใหม่อีกครั้ง');
    }
  }
}
