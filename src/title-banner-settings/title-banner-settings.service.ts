import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CreateTitleBannerSettingDto } from './dto/create-title-banner-setting.dto';
import { UpdateTitleBannerSettingDto } from './dto/update-title-banner-setting.dto';

@Injectable()
export class TitleBannerSettingsService {
  private readonly logger = new Logger(TitleBannerSettingsService.name);

  constructor(
    private readonly db: FncDB,
    private readonly auditLogService: AuditLogService
  ) { }

  async create(createDto: CreateTitleBannerSettingDto, userId: string) {
    const client = await this.db.startTransaction();
    try {
      const data = {
        branch: createDto.branch,
        topic: createDto.topic,
        description_th: createDto.description_th,
        description_en: createDto.description_en,
        image_url: createDto.image_url,
        created_by: userId,
        updated_by: userId
      };

      const setting = await this.db.insert('title_banner_settings', data, client);

      await this.auditLogService.log(client, {
        actionType: 'CREATE',
        moduleName: 'title_banner_settings',
        recordId: setting.id.toString(),
        newData: data,
        remark: 'สร้างการตั้งค่าคำอธิบายแบนเนอร์'
      }, { userId: parseInt(userId, 10) || 0 });

      await this.db.commit(client);
      return { success: true, id: setting.id, message: 'สร้างการตั้งค่าสำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to create setting: ${error.message}`, error.stack);
      throw new BadRequestException('เกิดข้อผิดพลาดในการสร้างข้อมูล');
    }
  }

  async findAll() {
    const sql = `
      SELECT *
      FROM title_banner_settings
      ORDER BY id ASC
    `;
    return await this.db.query(sql);
  }

  async findOne(id: number) {
    const sql = `
      SELECT *
      FROM title_banner_settings
      WHERE id = $1
    `;
    const result = await this.db.query(sql, [id]);

    if (!result || result.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลนี้ในระบบ');
    }

    return result[0];
  }

  async update(id: number, updateDto: UpdateTitleBannerSettingDto, userId: string) {
    const oldSetting = await this.findOne(id);

    const client = await this.db.startTransaction();
    try {
      const data: any = {};
      if (updateDto.branch !== undefined) data.branch = updateDto.branch;
      if (updateDto.topic !== undefined) data.topic = updateDto.topic;
      if (updateDto.description_th !== undefined) data.description_th = updateDto.description_th;
      if (updateDto.description_en !== undefined) data.description_en = updateDto.description_en;
      if (updateDto.image_url !== undefined) data.image_url = updateDto.image_url;

      data.updated_by = userId;
      data.updated_at = new Date();

      if (Object.keys(data).length > 2) {
        await this.db.update('title_banner_settings', data, { id }, client);
      }

      await this.auditLogService.log(client, {
        actionType: 'UPDATE',
        moduleName: 'title_banner_settings',
        recordId: id.toString(),
        oldData: oldSetting,
        newData: data,
        remark: 'อัปเดตการตั้งค่าคำอธิบายแบนเนอร์'
      }, { userId: parseInt(userId, 10) || 0 });

      await this.db.commit(client);
      return { success: true, message: 'อัปเดตข้อมูลสำเร็จ' };
    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to update setting: ${error.message}`, error.stack);
      throw new BadRequestException(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  }

  async remove(id: number, userId: string) {
    const oldSetting = await this.findOne(id);

    const client = await this.db.startTransaction();
    try {
      await this.db.delete('title_banner_settings', { id }, client);

      await this.auditLogService.log(client, {
        actionType: 'DELETE',
        moduleName: 'title_banner_settings',
        recordId: id.toString(),
        oldData: oldSetting,
        remark: 'ลบการตั้งค่าคำอธิบายแบนเนอร์'
      }, { userId: parseInt(userId, 10) || 0 });

      await this.db.commit(client);
      return { success: true, message: 'ลบข้อมูลสำเร็จ' };
    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to delete setting: ${error.message}`, error.stack);
      throw new BadRequestException(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  }

  async getLogs(id: number) {
    return this.auditLogService.getLogs('title_banner_settings', id.toString());
  }
}
