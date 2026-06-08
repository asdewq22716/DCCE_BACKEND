import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { CreateApprovalDto, ActionApprovalDto } from './dto/approval.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly db: FncDB,
    private readonly notificationsService: NotificationsService
  ) {}

  /**
   * สร้างรายการอนุมัติใหม่ลงตารางกลาง
   */
  async createApproval(dto: CreateApprovalDto, client?: any) {
    const insertData = {
      ref_table: dto.ref_table,
      ref_id: dto.ref_id,
      title: dto.title,
      payload: dto.payload ? JSON.stringify(dto.payload) : null,
      required_role: dto.required_role || null,
      required_user_id: dto.required_user_id || null,
      status: 'pending',
      current_level: 1,
      max_level: dto.max_level || 1,
      requester_id: dto.requester_id || 'system'
    };

    let newApprovalId: number;
    if (client) {
      const result = await this.db.insert('approvals', insertData, client);
      newApprovalId = result.id;
    } else {
      const result = await this.db.insert('approvals', insertData);
      newApprovalId = result.id;
    }

    // สร้างการแจ้งเตือน
    await this.notificationsService.createNotification({
      title: `รออนุมัติ: ${dto.title}`,
      message: `มีรายการรออนุมัติใหม่จากระบบ ${dto.ref_table}`,
      type: 'INFO',
      action_url: `/admin/approvals`, // หน้า Inbox กลาง
      ref_table: 'approvals',
      ref_id: newApprovalId.toString(),
      target_role: dto.required_role,
      target_user_id: dto.required_user_id,
      sender_id: dto.requester_id
    }, client);

    return { id: newApprovalId, ...insertData };
  }

  /**
   * ดึงรายการที่รออนุมัติทั้งหมด (Inbox)
   * สามารถกรองตาม role หรือ userId ได้ถ้าต้องการ
   */
  async getPendingApprovals() {
    const sql = `
      SELECT * 
      FROM approvals 
      WHERE status = 'pending' 
      ORDER BY created_at DESC
    `;
    return await this.db.query(sql);
  }

  /**
   * ดำเนินการอนุมัติหรือไม่อนุมัติ (Action)
   */
  async actionApproval(id: number, dto: ActionApprovalDto, userId: string) {
    // 1. ดึงข้อมูลคำขอ
    const sql = `SELECT * FROM approvals WHERE id = $1 FOR UPDATE`;
    const approval = await this.db.query(sql, [id]);

    if (!approval || approval.length === 0) {
      throw new NotFoundException('ไม่พบรายการคำขอนี้');
    }

    const task = approval[0];

    if (task.status !== 'pending') {
      throw new BadRequestException('รายการนี้ถูกดำเนินการไปแล้ว');
    }

    // 2. สร้าง Log
    await this.db.insert('approval_logs', {
      approval_id: task.id,
      step: task.current_level,
      action: dto.action,
      comment: dto.comment || '',
      action_by: userId
    });

    // 3. จัดการสถานะใหม่
    let newStatus = 'pending';
    let newLevel = task.current_level;

    if (dto.action === 'rejected') {
      newStatus = 'rejected';
    } else if (dto.action === 'approved') {
      if (task.current_level >= task.max_level) {
        newStatus = 'approved';
      } else {
        newLevel = task.current_level + 1;
      }
    }

    // 4. อัปเดตตาราง approvals
    await this.db.update('approvals', {
      status: newStatus,
      current_level: newLevel,
      updated_at: new Date()
    }, { id: task.id });

    // 5. ถ้าผ่านทั้งหมด หรือถูกปฏิเสธ ให้แจ้งไปตารางต้นทาง (Router)
    if (newStatus !== 'pending') {
      await this.notifySourceTable(task.ref_table, task.ref_id, newStatus);
      
      // แจ้งเตือนกลับไปยังคนขอ (requester_id) ว่าผลเป็นยังไง
      await this.notificationsService.createNotification({
        title: `คำขอ ${task.title} อัปเดตสถานะ`,
        message: `คำขอของคุณถูก ${newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} แล้ว`,
        type: newStatus === 'approved' ? 'SUCCESS' : 'ERROR',
        action_url: `/user/my-requests`,
        ref_table: task.ref_table,
        ref_id: task.ref_id,
        target_user_id: task.requester_id,
        sender_id: userId
      });
    }

    return { message: 'บันทึกการดำเนินการสำเร็จ', status: newStatus };
  }

  /**
   * แจ้งเตือนไปยังตารางต้นทางว่าสถานะการอนุมัติสิ้นสุดแล้ว
   */
  private async notifySourceTable(refTable: string, refId: string, finalStatus: string) {
    try {
      if (refTable === 'api_requests') {
        // อัปเดตสถานะในตาราง api_requests
        const sql = `UPDATE api_requests SET status = $1 WHERE id = $2`;
        await this.db.query(sql, [finalStatus, refId]);
        this.logger.log(`Updated api_requests ID ${refId} to ${finalStatus}`);
      }
    } catch (error) {
      this.logger.error(`Error notifying source table ${refTable}:`, error);
    }
  }
}
