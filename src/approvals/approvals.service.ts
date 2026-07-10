import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateApprovalDto, ActionApprovalDto } from './dto/approval.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly db: FncDB,
    private readonly notificationsService: NotificationsService
  ) { }

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

    // 2. ดึงเป้าหมายเพิ่มเติม (เช่น super_user ที่ดูแลสาขาของคนขอ)
    let extraTargetUserIds: string[] = [];
    if (dto.requester_id && dto.requester_id !== 'system') {
      try {
        const sql = `
          SELECT DISTINCT uo_super.user_id
          FROM user_organizations uo_req
          JOIN organizations org_req ON uo_req.org_id = org_req.org_id
          JOIN organizations org_branch ON org_branch.org_id = CASE 
            WHEN org_req.level = 1 THEN org_req.org_id
            ELSE org_req.parent_id
          END
          JOIN user_organizations uo_super ON uo_super.org_id = org_branch.org_id
          JOIN user_roles ur_super ON ur_super.user_id = uo_super.user_id
          JOIN roles r_super ON r_super.role_id = ur_super.role_id
          WHERE uo_req.user_id = $1 AND r_super.role_name = 'super_user'
        `;
        const executeQuery = client ? 
          await this.db.queryTx(client, sql, [dto.requester_id]) : 
          await this.db.query(sql, [dto.requester_id]);

        extraTargetUserIds = executeQuery.map((row: any) => row.user_id.toString());
      } catch (e: any) {
        this.logger.error(`Error finding super_users for branch: ${e.message}`);
      }
    }

    if (dto.required_user_id) {
      extraTargetUserIds.push(dto.required_user_id);
    }

    // 3. สร้างการแจ้งเตือน
    await this.notificationsService.createNotification({
      title: `รออนุมัติ: ${dto.title}`,
      message: `มีรายการรออนุมัติใหม่จากระบบ ${dto.ref_table}`,
      type: 'INFO',
      action_url: `/cms/approve-api/${dto.ref_id}`,
      ref_table: 'approvals',
      ref_id: newApprovalId.toString(),
      target_role: dto.required_role,
      target_user_ids: extraTargetUserIds.length > 0 ? extraTargetUserIds : undefined,
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

    // Validation เพิ่มเติมสำหรับ api_requests (ถ้าอนุมัติ ต้องมี start_date)
    if (task.ref_table === 'api_requests' && dto.action === 'approved') {
      if (!dto.extra_data || !dto.extra_data.start_date) {
        throw new BadRequestException('ต้องระบุวันที่เริ่มต้นใช้งาน (start_date)');
      }
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
      await this.notifySourceTable(task.ref_table, task.ref_id, newStatus, dto.extra_data);

      // แจ้งเตือนกลับไปยังคนขอ (requester_id) ว่าผลเป็นยังไง
      await this.notificationsService.createNotification({
        title: `คำขอ ${task.title} อัปเดตสถานะ`,
        message: `คำขอของคุณถูก ${newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} แล้ว`,
        type: newStatus === 'approved' ? 'SUCCESS' : 'ERROR',
        action_url: `/wrm/request-api?id=${task.ref_id}`,
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
  private async notifySourceTable(refTable: string, refId: string, finalStatus: string, extraData?: any) {
    try {
      if (refTable === 'api_requests') {
        // ดึงข้อมูลเดิมออกมาก่อน
        const requestData = await this.db.select('api_requests', { id: refId });

        if (requestData && requestData.length > 0) {
          const requestInfo = requestData[0];

          // เตรียมข้อมูลสำหรับอัปเดต
          const updateData: any = { status: finalStatus };
          if (extraData?.start_date) updateData.start_date = extraData.start_date;
          if (extraData?.end_date) updateData.end_date = extraData.end_date;

          // อัปเดตข้อมูลด้วยฟังก์ชันของระบบ
          await this.db.update('api_requests', updateData, { id: refId });
          this.logger.log(`Updated api_requests ID ${refId} to ${finalStatus}`);

          // ถ้าสถานะเป็น approved ให้สร้าง API Token
          if (finalStatus === 'approved') {
            const requestId = requestInfo.request_id;
            const token = uuidv4();

            let expiredAt: Date | null = null;
            // ใช้ end_date จาก admin ถ้าไม่ได้ระบุให้เป็น null (ไม่มีวันหมดอายุ)
            if (extraData?.end_date) {
              expiredAt = new Date(extraData.end_date);
            }

            await this.db.insert('api_tokens', {
              request_id: requestId,
              token: token,
              expired_at: expiredAt
            });
            this.logger.log(`Generated API Token for request_id ${requestId} (Expires: ${expiredAt ? expiredAt.toISOString() : 'Never'})`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error notifying source table ${refTable}:`, error);
    }
  }
}
