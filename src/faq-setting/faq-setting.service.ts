import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateFaqSettingDto } from './dto/create-faq-setting.dto';
import { UpdateFaqSettingDto } from './dto/update-faq-setting.dto';

@Injectable()
export class FaqSettingService {
  private readonly logger = new Logger(FaqSettingService.name);

  constructor(
    private readonly db: FncDB,
    private readonly uploadsService: UploadsService,
    private readonly auditLogService: AuditLogService
  ) {}

  async create(createDto: CreateFaqSettingDto, userId: string) {
    const client = await this.db.startTransaction();
    try {
      // ตรวจสอบรูปภาพ
      if (createDto.image_ids && createDto.image_ids.length > 0) {
        for (const id of createDto.image_ids) {
          const exists = await this.db.exists('uploads', { id, is_active: 1 }, client);
          if (!exists) throw new BadRequestException(`ไม่พบรูปภาพ (ID: ${id}) หรือถูกลบไปแล้ว`);
        }
      }

      // สร้างข้อมูล FAQ
      const faqData = {
        question: createDto.question,
        answer: createDto.answer,
        is_active: createDto.is_active ?? 1,
        created_by: userId,
        updated_by: userId
      };

      const faqRecord = await this.db.insert('faq_setting', faqData, client);

      // ผูกรูปภาพ
      if (createDto.image_ids && createDto.image_ids.length > 0) {
        await this.uploadsService.linkFiles({
          uploadIds: createDto.image_ids,
          refTable: 'faq_setting',
          refId: faqRecord.id,
          tag: 'faq_images',
          userId,
          client
        });
      }

      // บันทึก Audit Log
      await this.auditLogService.log(client, {
        actionType: 'CREATE',
        moduleName: 'faq_setting',
        recordId: faqRecord.id.toString(),
        newData: faqData,
        remark: createDto.remark || 'เพิ่มหัวข้อคำถามใหม่'
      }, { userId: parseInt(userId, 10) });

      await this.db.commit(client);
      return { success: true, id: faqRecord.id, message: 'บันทึกคำถามที่พบบ่อยสำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to create FAQ: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('เกิดข้อผิดพลาดในการบันทึกคำถาม');
    }
  }

  async findAll() {
    const sql = `
      SELECT 
        f.*,
        ${this.uploadsService.buildFilesSubquery('faq_setting', 'f.id', 'faq_images')} AS images
      FROM faq_setting f
      WHERE f.deleted_at IS NULL
      ORDER BY f.created_at DESC
    `;
    return await this.db.query(sql);
  }

  async findOne(id: number) {
    const sql = `
      SELECT 
        f.*,
        ${this.uploadsService.buildFilesSubquery('faq_setting', 'f.id', 'faq_images')} AS images
      FROM faq_setting f
      WHERE f.id = $1 AND f.deleted_at IS NULL
    `;
    const result = await this.db.query(sql, [id]);

    if (!result || result.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลคำถามนี้ในระบบ');
    }

    return result[0];
  }

  async update(id: number, updateDto: UpdateFaqSettingDto, userId: string) {
    const oldRecord = await this.findOne(id);
    const client = await this.db.startTransaction();

    try {
      const updateData: any = {};
      if (updateDto.question !== undefined) updateData.question = updateDto.question;
      if (updateDto.answer !== undefined) updateData.answer = updateDto.answer;
      if (updateDto.is_active !== undefined) updateData.is_active = updateDto.is_active;

      updateData.updated_by = userId;
      updateData.updated_at = new Date();

      if (Object.keys(updateData).length > 2) {
        await this.db.update('faq_setting', updateData, { id }, client);
      }

      // จัดการเชื่อมโยงรูปภาพ
      if (updateDto.image_ids) {
        await this.uploadsService.syncFiles({
          newUploadIds: updateDto.image_ids,
          refTable: 'faq_setting',
          refId: id,
          tag: 'faq_images',
          userId,
          client
        });
      }

      // บันทึก Audit Log
      await this.auditLogService.log(client, {
        actionType: 'UPDATE',
        moduleName: 'faq_setting',
        recordId: id.toString(),
        oldData: oldRecord,
        newData: updateData,
        remark: updateDto.remark || 'แก้ไขหัวข้อคำถาม'
      }, { userId: parseInt(userId, 10) });

      await this.db.commit(client);
      return { success: true, message: 'อัปเดตข้อมูลสำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to update FAQ: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`เกิดข้อผิดพลาดในการอัปเดต: ${error.message}`);
    }
  }

  async updateStatus(id: number, is_active: number, userId: string) {
    const oldRecord = await this.findOne(id);

    try {
      await this.db.update('faq_setting', {
        is_active,
        updated_by: userId,
        updated_at: new Date()
      }, { id });

      // บันทึก Audit Log
      await this.auditLogService.log(null, {
        actionType: 'UPDATE',
        moduleName: 'faq_setting',
        recordId: id.toString(),
        oldData: oldRecord,
        newData: { is_active },
        remark: is_active === 1 ? 'เปิดสถานะการใช้งาน' : 'ปิดสถานะการใช้งาน'
      }, { userId: parseInt(userId, 10) });

      return { success: true, message: 'อัปเดตสถานะสำเร็จ' };
    } catch (error: any) {
      this.logger.error(`Failed to update FAQ status: ${error.message}`, error.stack);
      throw new BadRequestException('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  }

  async remove(id: number, userId: string) {
    const oldRecord = await this.findOne(id);
    
    // Soft Delete
    await this.db.update('faq_setting', {
      is_active: 0,
      deleted_at: new Date(),
      deleted_by: userId
    }, { id });

    // บันทึก Audit Log
    await this.auditLogService.log(null, {
      actionType: 'DELETE',
      moduleName: 'faq_setting',
      recordId: id.toString(),
      oldData: oldRecord,
      remark: 'ลบหัวข้อคำถาม (Soft Delete)'
    }, { userId: parseInt(userId, 10) });

    return { success: true, message: 'ลบข้อมูลสำเร็จ' };
  }

  async getLogs(id: number) {
    return this.auditLogService.getLogs('faq_setting', id.toString());
  }
}
