import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly db: FncDB) {}

  /**
   * สร้างการแจ้งเตือนใหม่ (ใช้เรียกจาก Service อื่นๆ ได้เลย)
   */
  async createNotification(dto: CreateNotificationDto, clientTx?: any) {
    try {
      const data: any = {
        title: dto.title,
        message: dto.message || null,
        type: dto.type || 'INFO',
        action_url: dto.action_url || null,
        payload: dto.payload ? JSON.stringify(dto.payload) : null,
        ref_table: dto.ref_table || null,
        ref_id: dto.ref_id || null,
        sender_id: dto.sender_id || 'system',
        target_role: dto.target_role || null,
        target_user_id: dto.target_user_id || null,
        is_read: 0,
        created_at: new Date(),
      };

      if (clientTx) {
        return await this.db.insert('notifications', data, clientTx);
      } else {
        return await this.db.insert('notifications', data);
      }
    } catch (error: any) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
      // ไม่ต้องโยน Error ออกไปเพื่อไม่ให้กระทบ Flow หลักของระบบ
    }
  }

  /**
   * ดึงการแจ้งเตือนทั้งหมดของผู้ใช้งานปัจจุบัน
   * โดยเช็คจาก userId และ role ของ user
   */
  async getMyNotifications(userId: string, roleName: string) {
    // ดึง Noti ที่เจาะจงถึงตัวเอง หรือ เจาะจงถึงกลุ่มตัวเอง
    const sql = `
      SELECT * FROM notifications 
      WHERE target_user_id = $1 
         OR target_role = $2 
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    const items = await this.db.query(sql, [userId, roleName]);
    
    // แปลง payload กลับเป็น JSON object
    return items.map(item => ({
      ...item,
      payload: item.payload ? (typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload) : null
    }));
  }

  /**
   * เปลี่ยนสถานะการแจ้งเตือนเป็น "อ่านแล้ว"
   */
  async markAsRead(id: number) {
    try {
      const sqlCheck = `SELECT id FROM notifications WHERE id = $1`;
      const exists = await this.db.query(sqlCheck, [id]);
      if (exists.length === 0) {
        throw new NotFoundException('ไม่พบข้อมูลแจ้งเตือน');
      }

      await this.db.update('notifications', { is_read: 1 }, { id });
      return { success: true, message: 'ทำเครื่องหมายว่าอ่านแล้ว' };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('ไม่สามารถอัปเดตสถานะได้');
    }
  }
}
