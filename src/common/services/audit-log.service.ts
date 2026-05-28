import { Injectable, Logger } from '@nestjs/common';
import { FncDB } from './fnc-db.service';

export interface AuditContext {
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditPayload {
  actionType: string; // เช่น 'CREATE', 'UPDATE', 'DELETE'
  moduleName: string; // เช่น 'organizations'
  recordId: string; // เช่น ID ของข้อมูลหลัก
  oldData?: any; // ข้อมูลดิบก่อนทำการแก้ไข
  newData?: any; // ข้อมูลดิบหลังทำการแก้ไข
  remark?: string; // หมายเหตุ/เหตุผลการแก้ไข
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly db: FncDB) { }

  /**
   * บันทึกประวัติกิจกรรมและการแก้ไขลงตาราง audit_logs
   * @param client Database Connection ในทรานแซกชันปัจจุบัน
   * @param payload รายละเอียดการบันทึก Log
   * @param context ข้อมูลแวดล้อมของผู้เรียกใช้ (IP, User ID, User Agent)
   */
  async log(client: any, payload: AuditPayload, context?: AuditContext) {
    try {
      await this.db.insert(
        'audit_logs',
        {
          created_by: context?.userId || null,
          action_type: payload.actionType,
          module_name: payload.moduleName,
          record_id: payload.recordId,
          old_data: payload.oldData ? JSON.stringify(payload.oldData) : null,
          new_data: payload.newData ? JSON.stringify(payload.newData) : null,
          remark: payload.remark || null,
          ip_address: context?.ipAddress || null,
          user_agent: context?.userAgent || null,
        },
        client,
      );
    } catch (err: any) {
      this.logger.error(`Failed to write audit log: ${err.message}`);
      throw err; // เพื่อให้เกิด rollback ในทรานแซกชันหลักหากคิวรีนี้ล้มเหลว
    }
  }

  /**
   * ดึงข้อมูลประวัติกิจกรรม (Audit Logs) ตามโมดูลและ ID
   * @param moduleName ชื่อโมดูล เช่น 'banners'
   * @param recordId ID ของข้อมูลที่ต้องการดูประวัติ
   */
  async getLogs(moduleName: string, recordId: string) {
    const sql = `
      SELECT 
        a.log_id,
        a.action_type,
        a.created_at,
        a.created_by,
        u.sso_firstname,
        u.sso_lastname,
        u.full_name,
        a.old_data,
        a.new_data,
        a.remark
      FROM audit_logs a
      LEFT JOIN users u ON a.created_by = u.user_id
      WHERE a.module_name = $1 AND a.record_id = $2
      ORDER BY a.created_at DESC
    `;
    const logs = await this.db.query(sql, [moduleName, recordId]);

    // แปลงข้อมูล JSON string กลับเป็น Object
    return logs.map((log: any) => ({
      ...log,
      old_data: log.old_data ? (typeof log.old_data === 'string' ? JSON.parse(log.old_data) : log.old_data) : null,
      new_data: log.new_data ? (typeof log.new_data === 'string' ? JSON.parse(log.new_data) : log.new_data) : null,
    }));
  }

  /**
   * ดึงรายชื่อโมดูลทั้งหมดที่มีการบันทึก Log ในระบบ (สำหรับทำ Dropdown)
   */
  async getAvailableModules() {
    const sql = `
      SELECT DISTINCT module_name 
      FROM audit_logs 
      WHERE module_name IS NOT NULL
      ORDER BY module_name ASC
    `;
    const rows = await this.db.query(sql);
    return rows.map((r: any) => r.module_name);
  }
}
