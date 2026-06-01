import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateManualDto } from './dto/update-manual.dto';

@Injectable()
export class ManualService {
  private readonly logger = new Logger(ManualService.name);

  constructor(
    private readonly db: FncDB,
    private readonly uploadsService: UploadsService,
    private readonly auditLogService: AuditLogService
  ) { }

  async getManual() {
    const sql = `
      SELECT 
        m.*,
        ${this.uploadsService.buildFilesSubquery('manual_setting', 'm.id', 'manual_th')} AS file_th,
        ${this.uploadsService.buildFilesSubquery('manual_setting', 'm.id', 'manual_en')} AS file_en
      FROM manual_setting m
      WHERE m.id = 1
    `;
    const result = await this.db.query(sql);

    if (!result || result.length === 0) {
      return { id: 1, remark: '', file_th: [], file_en: [] };
    }

    return result[0];
  }

  async updateManual(updateDto: UpdateManualDto, userId: string) {
    const oldData = await this.getManual();
    const client = await this.db.startTransaction();

    try {
      const updateData: any = {};
      if (updateDto.remark !== undefined) updateData.remark = updateDto.remark;

      updateData.updated_by = userId;
      updateData.updated_at = new Date();

      // Ensure id 1 exists
      const exists = await this.db.query('SELECT id FROM manual_setting WHERE id = 1');
      if (!exists || exists.length === 0) {
        await this.db.insert('manual_setting', { id: 1, ...updateData }, client);
      } else if (Object.keys(updateData).length > 2) {
        await this.db.update('manual_setting', updateData, { id: 1 }, client);
      }

      // Sync Thai File
      if (updateDto.file_th_ids !== undefined) {
        await this.uploadsService.syncFiles({
          newUploadIds: updateDto.file_th_ids || [],
          refTable: 'manual_setting',
          refId: 1,
          tag: 'manual_th',
          userId,
          client
        });
      }

      // Sync English File
      if (updateDto.file_en_ids !== undefined) {
        await this.uploadsService.syncFiles({
          newUploadIds: updateDto.file_en_ids || [],
          refTable: 'manual_setting',
          refId: 1,
          tag: 'manual_en',
          userId,
          client
        });
      }

      // Audit Log
      await this.auditLogService.log(client, {
        actionType: 'UPDATE',
        moduleName: 'manual',
        recordId: '1',
        oldData: oldData,
        newData: updateData,
        remark: 'อัปเดตตั้งค่าคู่มือการใช้งาน'
      }, { userId: parseInt(userId, 10) });

      await this.db.commit(client);
      return { success: true, message: 'บันทึกตั้งค่าคู่มือการใช้งานสำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to update manual settings: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`);
    }
  }

  async getLogs() {
    return this.auditLogService.getLogs('manual_setting', '1');
  }
}
