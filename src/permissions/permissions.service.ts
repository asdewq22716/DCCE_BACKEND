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
  ) { }

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

  async syncPermissions(dto: SyncPermissionsDto, context: AuditContext) {
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

      // 3. บันทึกประวัติการกระทำ (Audit Log)
      await this.auditLog.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'permissions',
          recordId: 'SYNC',
          newData: dto,
          remark: 'ปรับปรุงโครงสร้างสิทธิ์ทั้งหมดของระบบ (Bulk Sync)',
        },
        context
      );

      // 4. ยืนยันการทำงานทั้งหมด
      await this.db.commit(client);
      return { message: 'บันทึกโครงสร้างสิทธิ์ทั้งหมดสำเร็จ (Sync Success)' };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Sync permissions error: ${err.message}`);
      throw new BadRequestException('บันทึกข้อมูลไม่สำเร็จ (อาจมีรหัสสิทธิ์ซ้ำซ้อนกัน)');
    }
  }

  async getUserAllOrgPermissions(userId: number) {
    // 1. ดึงสถานะของ User
    const users = await this.db.query(
      'SELECT permission_status, permission_remark FROM users WHERE user_id = $1',
      [userId],
    );
    const userProfile = users.length > 0 ? users[0] : { permission_status: 1, permission_remark: null };

    // 2. ดึงข้อมูล override ทั้งหมดของ user นี้เฉพาะที่อนุญาต (is_deny = 0)
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

    const orgPermissionsArray = Object.keys(grouped).map((orgId) => ({
      org_id: parseInt(orgId),
      permissionIds: grouped[orgId], // ตรงกับ Field ขา POST
    }));

    return {
      permission_status: userProfile.permission_status,
      permission_remark: userProfile.permission_remark,
      orgPermissions: orgPermissionsArray,
    };
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

  async saveAllUserOrgPermissions(userId: number, dto: BulkUpdateUserOrgPermissionsDto, context: AuditContext) {
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

      // 2. ล้างข้อมูล (Override) เดิมของ User คนนี้ใน "ทุกหน่วยงาน" ทิ้งให้หมดก่อน
      await this.db.queryTx(client, 'DELETE FROM user_permissions WHERE user_id = $1', [userId]);

      // 3. Loop วนทีละหน่วยงานที่ส่งมาเพื่อบันทึกใหม่
      if (dto.orgPermissions && dto.orgPermissions.length > 0) {
        for (const item of dto.orgPermissions) {
          const orgId = item.org_id;
          const permissionIds = item.permissionIds || [];

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
      }

      // 4. บันทึกประวัติการกระทำ (Audit Log)
      await this.auditLog.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'user_permissions',
          recordId: userId.toString(),
          newData: {
            permission_status: dto.permission_status,
            permission_remark: dto.permission_remark,
            orgPermissions: dto.orgPermissions,
          },
          remark: 'อัปเดตสิทธิ์รายบุคคล (Override)',
        },
        context
      );

      await this.db.commit(client);
      return { message: 'บันทึกสิทธิ์ทุกหน่วยงานสำเร็จ' };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Error saving user org permissions: ${err.message}`);
      throw new BadRequestException('ไม่สามารถบันทึกสิทธิ์ได้ กรุณาลองใหม่อีกครั้ง');
    }
  }

  async getEffectivePermissions(userId: number) {
    // 1. ตรวจสอบ Profile และสิทธิ์รวมของ User
    const users = await this.db.query(
      'SELECT permission_status, permission_remark FROM users WHERE user_id = $1',
      [userId]
    );
    if (users.length === 0) {
      throw new BadRequestException('ไม่พบผู้ใช้งานในระบบ');
    }
    const userProfile = users[0];

    // ถ้า User ถูกระงับสิทธิ์การใช้งาน (แบน) ให้ส่งคืนค่าว่างทั้งหมดเพื่อความปลอดภัยสูงสุด
    if (userProfile.permission_status !== 1) {
      return {
        permission_status: userProfile.permission_status,
        permission_remark: userProfile.permission_remark,
        global_permissions: [],
        organizations: [],
      };
    }

    // 2. ดึง Global Permissions จาก Roles ที่ Active (สิทธิ์พื้นฐานตั้งต้น)
    const globalPermsResult = await this.db.query(
      `SELECT DISTINCT p.p_key 
       FROM user_roles ur 
       JOIN role_permissions rp ON ur.role_id = rp.role_id 
       JOIN permissions p ON rp.permission_id = p.permission_id 
       JOIN roles r ON r.role_id = ur.role_id 
       WHERE ur.user_id = $1 
         AND p.is_active = 1 
         AND r.is_active = 1 
         AND r.role_status = 1`,
      [userId]
    );
    const globalPermissions = globalPermsResult.map((r: any) => r.p_key);

    // 3. ดึง Organization Permissions (แยกตามหน่วยงานที่สังกัด)
    const orgsResult = await this.db.query(
      `SELECT o.org_id, o.org_name 
       FROM user_organizations uo 
       JOIN organizations o ON uo.org_id = o.org_id 
       WHERE uo.user_id = $1 
         AND o.is_active = 1 
         AND o.permission_is_active = 1`,
      [userId]
    );

    const organizations = [];

    for (const org of orgsResult) {
      // 3.1 สิทธิ์พื้นฐานของหน่วยงาน (Base Permissions)
      const basePermsResult = await this.db.query(
        `SELECT p.p_key 
         FROM organization_permissions op 
         JOIN permissions p ON op.permission_id = p.permission_id 
         WHERE op.org_id = $1 AND p.is_active = 1`,
        [org.org_id]
      );
      const basePerms = new Set(basePermsResult.map((r: any) => r.p_key));

      // 3.2 สิทธิ์พิเศษของรายบุคคล (Overrides)
      const overrideResult = await this.db.query(
        `SELECT p.p_key, up.is_deny 
         FROM user_permissions up 
         JOIN permissions p ON up.permission_id = p.permission_id 
         WHERE up.user_id = $1 AND up.org_id = $2 AND p.is_active = 1`,
        [userId, org.org_id]
      );

      // คำนวณ (Base + อนุญาตเพิ่ม) - ถูกระงับ
      for (const override of overrideResult) {
        if (override.is_deny === 0) {
          basePerms.add(override.p_key);
        } else if (override.is_deny === 1) {
          basePerms.delete(override.p_key);
        }
      }

      // 3.3 นำ Global Permissions (จาก Role) มาทับเป็นขั้นสุดท้าย! 
      // (สิทธิ์แอดมินหรือ Role หลักจะไม่มีวันถูกลบโดยการ Override ระดับหน่วยงาน)
      for (const gp of globalPermissions) {
        basePerms.add(gp);
      }
      organizations.push({
        org_id: org.org_id,
        org_name: org.org_name,
        permissions: Array.from(basePerms),
      });
    }

    return {
      permission_status: userProfile.permission_status,
      permission_remark: userProfile.permission_remark,
      global_permissions: globalPermissions,
      organizations: organizations,
    };
  }
}
