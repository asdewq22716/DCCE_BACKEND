import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateAboutUsDto } from './dto/update-about-us.dto';

@Injectable()
export class AboutUsService {
  private readonly logger = new Logger(AboutUsService.name);

  constructor(
    private readonly db: FncDB,
    private readonly uploadsService: UploadsService,
    private readonly auditLogService: AuditLogService
  ) {}

  async getAboutUs() {
    const sql = `
      SELECT 
        a.*,
        ${this.uploadsService.buildFilesSubquery('about_us', 'a.id', 'about_us_images')} AS images
      FROM about_us a
      WHERE a.id = 1
    `;
    const result = await this.db.query(sql);

    // ถ้าไม่มีข้อมูลเลย (กรณีลืมรันคำสั่ง Insert) ให้ส่งค่า Default กลับไป
    if (!result || result.length === 0) {
      return {
        id: 1,
        topic_th: '',
        topic_en: '',
        detail_th: '',
        detail_en: '',
        bg_text_th: '',
        bg_text_en: '',
        images: []
      };
    }

    return result[0];
  }

  async updateAboutUs(updateDto: UpdateAboutUsDto, userId: string) {
    const oldData = await this.getAboutUs();
    const client = await this.db.startTransaction();

    try {
      const updateData: any = {};
      if (updateDto.topic_th !== undefined) updateData.topic_th = updateDto.topic_th;
      if (updateDto.topic_en !== undefined) updateData.topic_en = updateDto.topic_en;
      if (updateDto.detail_th !== undefined) updateData.detail_th = updateDto.detail_th;
      if (updateDto.detail_en !== undefined) updateData.detail_en = updateDto.detail_en;
      if (updateDto.bg_text_th !== undefined) updateData.bg_text_th = updateDto.bg_text_th;
      if (updateDto.bg_text_en !== undefined) updateData.bg_text_en = updateDto.bg_text_en;

      updateData.updated_by = userId;
      updateData.updated_at = new Date();

      // ตรวจสอบว่ามีแถว id = 1 หรือไม่ ถ้าไม่มีให้ Insert ก่อน
      const exists = await this.db.query('SELECT id FROM about_us WHERE id = 1');
      if (!exists || exists.length === 0) {
        await this.db.insert('about_us', { id: 1, ...updateData }, client);
      } else if (Object.keys(updateData).length > 2) { // มากกว่า 2 เพราะมี updated_by, updated_at
        await this.db.update('about_us', updateData, { id: 1 }, client);
      }

      // จัดการเชื่อมโยงรูปภาพ (ถ้ามีการส่ง image_ids มา)
      if (updateDto.image_ids) {
        // อิงตามเงื่อนไข UI: สูงสุด 5 รูป
        if (updateDto.image_ids.length > 5) {
            throw new BadRequestException('อัปโหลดรูปภาพได้สูงสุด 5 รูปภาพเท่านั้น');
        }

        await this.uploadsService.syncFiles({
          newUploadIds: updateDto.image_ids,
          refTable: 'about_us',
          refId: 1,
          tag: 'about_us_images',
          userId,
          client
        });
      }

      // บันทึก Audit Log
      await this.auditLogService.log(client, {
        actionType: 'UPDATE',
        moduleName: 'about_us',
        recordId: '1',
        oldData: oldData,
        newData: updateData,
        remark: 'อัปเดตข้อมูลตั้งค่าเกี่ยวกับเรา (About Us)'
      }, { userId: parseInt(userId, 10) });

      await this.db.commit(client);
      return { success: true, message: 'บันทึกข้อมูลตั้งค่าเกี่ยวกับเราสำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to update about us: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`);
    }
  }

  async getLogs() {
    return this.auditLogService.getLogs('about_us', '1');
  }
}
