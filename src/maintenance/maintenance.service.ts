import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private readonly db: FncDB,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getMaintenanceSettings() {
    const sql = `SELECT * FROM maintenance_settings WHERE id = 1`;
    const result = await this.db.query(sql);

    if (!result || result.length === 0) {
      // Return default values if not found (although it should be inserted via SQL)
      return {
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        auto_close_service: 1,
        notify_admin: 1,
        notify_admin_minutes: 30,
        is_indefinite: 0,
        remark: ''
      };
    }

    const data = result[0];
    return {
      start_date: data.start_date || '',
      start_time: data.start_time || '',
      end_date: data.end_date || '',
      end_time: data.end_time || '',
      auto_close_service: data.auto_close_service ?? 1,
      notify_admin: data.notify_admin ?? 1,
      notify_admin_minutes: data.notify_admin_minutes ?? 30,
      is_indefinite: data.is_indefinite ?? 0,
      remark: data.remark || ''
    };
  }

  async updateMaintenanceSettings(updateDto: UpdateMaintenanceDto, userId: string) {
    const oldRecord = await this.getMaintenanceSettings();
    const client = await this.db.startTransaction();

    try {
      const updateData: any = { ...updateDto };
      updateData.updated_by = userId;
      updateData.updated_at = new Date();

      // Ensure the record exists
      const exists = await this.db.query('SELECT id FROM maintenance_settings WHERE id = 1');
      if (exists && exists.length > 0) {
        await this.db.update('maintenance_settings', updateData, { id: 1 }, client);
      } else {
        await this.db.insert('maintenance_settings', { id: 1, ...updateData }, client);
      }

      // Record Audit Log
      await this.auditLogService.log(client, {
        actionType: 'UPDATE',
        moduleName: 'maintenance_settings',
        recordId: '1',
        oldData: oldRecord,
        newData: updateData,
        remark: 'อัปเดตการตั้งค่าระบบปิดปรับปรุง'
      }, { userId: parseInt(userId, 10) || 0 });

      await this.db.commit(client);
      return { success: true, message: 'บันทึกการตั้งค่าปิดปรับปรุงสำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to update maintenance settings: ${error.message}`, error.stack);
      throw new BadRequestException(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`);
    }
  }
}
