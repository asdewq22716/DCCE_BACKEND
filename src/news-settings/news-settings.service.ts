import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateNewsSettingDto } from './dto/create-news-setting.dto';
import { UpdateNewsSettingDto } from './dto/update-news-setting.dto';

@Injectable()
export class NewsSettingsService {
  private readonly logger = new Logger(NewsSettingsService.name);

  constructor(
    private readonly db: FncDB,
    private readonly uploadsService: UploadsService,
    private readonly auditLogService: AuditLogService
  ) {}

  async create(createDto: CreateNewsSettingDto, userId: string) {
    const client = await this.db.startTransaction();
    try {
      // ตรวจสอบรูปภาพ
      if (createDto.image_ids && createDto.image_ids.length > 0) {
        for (const id of createDto.image_ids) {
          const exists = await this.db.exists('uploads', { id, is_active: 1 }, client);
          if (!exists) throw new BadRequestException(`ไม่พบรูปภาพ (ID: ${id}) หรือถูกลบไปแล้ว`);
        }
      }

      // สร้างข้อมูลข่าว
      const newsData = {
        title_th: createDto.title_th,
        title_en: createDto.title_en,
        detail_th: createDto.detail_th,
        detail_en: createDto.detail_en,
        tags: createDto.tags ? JSON.stringify(createDto.tags) : null,
        link_url: createDto.link_url,
        start_date: createDto.start_date,
        end_date: createDto.end_date,
        is_never_ends: createDto.is_never_ends ?? 0,
        is_active: createDto.is_active ?? 1,
        created_by: userId,
        updated_by: userId
      };

      const newsRecord = await this.db.insert('news', newsData, client);

      // ผูกรูปภาพ
      if (createDto.image_ids && createDto.image_ids.length > 0) {
        await this.uploadsService.linkFiles({
          uploadIds: createDto.image_ids,
          refTable: 'news',
          refId: newsRecord.id,
          tag: 'news_images',
          userId,
          client
        });
      }

      // บันทึก Audit Log
      await this.auditLogService.log(client, {
        actionType: 'CREATE',
        moduleName: 'news',
        recordId: newsRecord.id.toString(),
        newData: newsData,
        remark: 'สร้างข่าวประชาสัมพันธ์ใหม่'
      }, { userId: parseInt(userId, 10) });

      await this.db.commit(client);
      return { success: true, id: newsRecord.id, message: 'สร้างข่าวประชาสัมพันธ์สำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to create news: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('เกิดข้อผิดพลาดในการสร้างข่าวประชาสัมพันธ์');
    }
  }

  async findAll() {
    const sql = `
      SELECT 
        n.*,
        ${this.uploadsService.buildFilesSubquery('news', 'n.id', 'news_images')} AS images
      FROM news n
      WHERE n.deleted_at IS NULL
      ORDER BY n.created_at DESC
    `;
    return await this.db.query(sql);
  }

  async findOne(id: number) {
    const sql = `
      SELECT 
        n.*,
        ${this.uploadsService.buildFilesSubquery('news', 'n.id', 'news_images')} AS images
      FROM news n
      WHERE n.id = $1 AND n.deleted_at IS NULL
    `;
    const result = await this.db.query(sql, [id]);

    if (!result || result.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลข่าวนี้ในระบบ');
    }

    return result[0];
  }

  async update(id: number, updateDto: UpdateNewsSettingDto, userId: string) {
    const oldRecord = await this.findOne(id);
    const client = await this.db.startTransaction();

    try {
      const updateData: any = {};
      if (updateDto.title_th !== undefined) updateData.title_th = updateDto.title_th;
      if (updateDto.title_en !== undefined) updateData.title_en = updateDto.title_en;
      if (updateDto.detail_th !== undefined) updateData.detail_th = updateDto.detail_th;
      if (updateDto.detail_en !== undefined) updateData.detail_en = updateDto.detail_en;
      if (updateDto.tags !== undefined) updateData.tags = updateDto.tags ? JSON.stringify(updateDto.tags) : null;
      if (updateDto.link_url !== undefined) updateData.link_url = updateDto.link_url;
      if (updateDto.start_date !== undefined) updateData.start_date = updateDto.start_date;
      if (updateDto.end_date !== undefined) updateData.end_date = updateDto.end_date;
      if (updateDto.is_never_ends !== undefined) updateData.is_never_ends = updateDto.is_never_ends;
      if (updateDto.is_active !== undefined) updateData.is_active = updateDto.is_active;

      updateData.updated_by = userId;
      updateData.updated_at = new Date();

      if (Object.keys(updateData).length > 2) {
        await this.db.update('news', updateData, { id }, client);
      }

      // จัดการเชื่อมโยงรูปภาพ (Sync Files)
      if (updateDto.image_ids) {
        await this.uploadsService.syncFiles({
          newUploadIds: updateDto.image_ids,
          refTable: 'news',
          refId: id,
          tag: 'news_images',
          userId,
          client
        });
      }

      // บันทึก Audit Log
      await this.auditLogService.log(client, {
        actionType: 'UPDATE',
        moduleName: 'news',
        recordId: id.toString(),
        oldData: oldRecord,
        newData: updateData,
        remark: 'อัปเดตข้อมูลข่าวประชาสัมพันธ์'
      }, { userId: parseInt(userId, 10) });

      await this.db.commit(client);
      return { success: true, message: 'อัปเดตข้อมูลสำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to update news: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`เกิดข้อผิดพลาดในการอัปเดต: ${error.message}`);
    }
  }

  async remove(id: number, userId: string) {
    const oldRecord = await this.findOne(id);
    
    // Soft Delete
    await this.db.update('news', {
      is_active: 0,
      deleted_at: new Date(),
      deleted_by: userId
    }, { id });

    // บันทึก Audit Log
    await this.auditLogService.log(null, {
      actionType: 'DELETE',
      moduleName: 'news',
      recordId: id.toString(),
      oldData: oldRecord,
      remark: 'ลบข่าวประชาสัมพันธ์ (Soft Delete)'
    }, { userId: parseInt(userId, 10) });

    return { success: true, message: 'ลบข้อมูลสำเร็จ' };
  }

  async getLogs(id: number) {
    return this.auditLogService.getLogs('news', id.toString());
  }
}
