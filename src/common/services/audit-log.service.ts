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

  constructor(private readonly db: FncDB) {}

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
}
