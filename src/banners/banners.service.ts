import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);

  constructor(
    private readonly db: FncDB,
    private readonly uploadsService: UploadsService,
    private readonly auditLogService: AuditLogService
  ) { }

  async create(createBannerDto: CreateBannerDto, userId: string) {
    const client = await this.db.startTransaction();
    try {
      // 1. ตรวจสอบว่ารูปภาพ PC มีอยู่ในระบบหรือไม่
      if (createBannerDto.image_pc_ids && createBannerDto.image_pc_ids.length > 0) {
        for (const id of createBannerDto.image_pc_ids) {
          const exists = await this.db.exists('uploads', { id: id, is_active: 1 }, client);
          if (!exists) throw new BadRequestException(`ไม่พบรูปภาพ PC (ID: ${id}) หรือถูกลบไปแล้ว`);
        }
      }

      // 2. ตรวจสอบรูปภาพ Mobile
      if (createBannerDto.image_mobile_ids && createBannerDto.image_mobile_ids.length > 0) {
        for (const id of createBannerDto.image_mobile_ids) {
          const exists = await this.db.exists('uploads', { id, is_active: 1 }, client);
          if (!exists) throw new BadRequestException(`ไม่พบรูปภาพ Mobile (ID: ${id}) หรือถูกลบไปแล้ว`);
        }
      }

      // 3. สร้าง Banner
      const bannerData = {
        title_th: createBannerDto.title_th,
        title_en: createBannerDto.title_en,
        link_url: createBannerDto.link_url,
        start_date: createBannerDto.start_date,
        end_date: createBannerDto.end_date,
        is_never_ends: createBannerDto.is_never_ends ?? 0,
        sort_order: createBannerDto.sort_order ?? 1,
        is_active: createBannerDto.is_active ?? 1,
        created_by: userId,
        updated_by: userId
      };

      const banner = await this.db.insert('banners', bannerData, client);

      // 4. ผูกรูปภาพ PC
      if (createBannerDto.image_pc_ids && createBannerDto.image_pc_ids.length > 0) {
        await this.uploadsService.linkFiles({
          uploadIds: createBannerDto.image_pc_ids,
          refTable: 'banners',
          refId: banner.id,
          tag: 'pc',
          userId,
          client
        });
      }

      // 5. ผูกรูปภาพ Mobile
      if (createBannerDto.image_mobile_ids && createBannerDto.image_mobile_ids.length > 0) {
        await this.uploadsService.linkFiles({
          uploadIds: createBannerDto.image_mobile_ids,
          refTable: 'banners',
          refId: banner.id,
          tag: 'mobile',
          userId,
          client
        });
      }

      // 6. บันทึก Audit Log
      await this.auditLogService.log(client, {
        actionType: 'CREATE',
        moduleName: 'banners',
        recordId: banner.id.toString(),
        newData: bannerData,
        remark: 'สร้างแบนเนอร์ใหม่'
      }, { userId: parseInt(userId, 10) });

      await this.db.commit(client);
      return { success: true, bannerId: banner.id, message: 'สร้างแบนเนอร์สำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to create banner: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('เกิดข้อผิดพลาดในการสร้างแบนเนอร์');
    }
  }

  async findAll() {
    const sql = `
      SELECT 
        b.*,
        ${this.uploadsService.buildFilesSubquery('banners', 'b.id', 'pc')} AS pc_images,
        ${this.uploadsService.buildFilesSubquery('banners', 'b.id', 'mobile')} AS mobile_images
      FROM banners b
      WHERE b.deleted_at IS NULL
      ORDER BY b.sort_order ASC, b.created_at DESC
    `;
    return await this.db.query(sql);
  }

  async findOne(id: number) {
    const sql = `
      SELECT 
        b.*,
        ${this.uploadsService.buildFilesSubquery('banners', 'b.id', 'pc')} AS pc_images,
        ${this.uploadsService.buildFilesSubquery('banners', 'b.id', 'mobile')} AS mobile_images
      FROM banners b
      WHERE b.id = $1 AND b.deleted_at IS NULL
    `;
    const result = await this.db.query(sql, [id]);

    if (!result || result.length === 0) {
      throw new NotFoundException('ไม่พบแบนเนอร์นี้ในระบบ');
    }

    return result[0];
  }

  async update(id: number, updateBannerDto: UpdateBannerDto, userId: string) {
    const oldBanner = await this.findOne(id); // ตรวจสอบว่ามีอยู่จริง และเก็บค่าเดิมไว้ทำ Log

    const client = await this.db.startTransaction();
    try {
      const bannerData: any = {};
      if (updateBannerDto.title_th !== undefined) bannerData.title_th = updateBannerDto.title_th;
      if (updateBannerDto.title_en !== undefined) bannerData.title_en = updateBannerDto.title_en;
      if (updateBannerDto.link_url !== undefined) bannerData.link_url = updateBannerDto.link_url;
      if (updateBannerDto.start_date !== undefined) bannerData.start_date = updateBannerDto.start_date;
      if (updateBannerDto.end_date !== undefined) bannerData.end_date = updateBannerDto.end_date;
      if (updateBannerDto.is_never_ends !== undefined) bannerData.is_never_ends = updateBannerDto.is_never_ends;
      if (updateBannerDto.sort_order !== undefined) bannerData.sort_order = updateBannerDto.sort_order;
      if (updateBannerDto.is_active !== undefined) bannerData.is_active = updateBannerDto.is_active;

      bannerData.updated_by = userId;
      bannerData.updated_at = new Date();

      if (Object.keys(bannerData).length > 2) {
        await this.db.update('banners', bannerData, { id }, client);
      }

      // ----------------------------------------
      // อัปเดตรูปภาพ PC (ถ้าส่งอาเรย์มา)
      // ----------------------------------------
      if (updateBannerDto.image_pc_ids) {
        await this.uploadsService.syncFiles({
          newUploadIds: updateBannerDto.image_pc_ids,
          refTable: 'banners',
          refId: id,
          tag: 'pc',
          userId,
          client
        });
      }

      // ----------------------------------------
      // อัปเดตรูปภาพ Mobile (ถ้าส่งอาเรย์มา)
      // ----------------------------------------
      if (updateBannerDto.image_mobile_ids) {
        await this.uploadsService.syncFiles({
          newUploadIds: updateBannerDto.image_mobile_ids,
          refTable: 'banners',
          refId: id,
          tag: 'mobile',
          userId,
          client
        });
      }

      // บันทึก Audit Log
      await this.auditLogService.log(client, {
        actionType: 'UPDATE',
        moduleName: 'banners',
        recordId: id.toString(),
        oldData: oldBanner,
        newData: bannerData,
        remark: 'อัปเดตข้อมูลแบนเนอร์'
      }, { userId: parseInt(userId, 10) });

      await this.db.commit(client);
      return { success: true, message: 'อัปเดตแบนเนอร์สำเร็จ' };
    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to update banner: ${error.message}`, error.stack);
      throw new BadRequestException(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  }

  async remove(id: number, userId: string) {
    const oldBanner = await this.findOne(id);

    // Soft Delete Banner
    await this.db.update('banners', {
      is_active: 0,
      deleted_at: new Date(),
      deleted_by: userId
    }, { id });

    // บันทึก Audit Log (ไม่ต้องใช้ transaction เพราะ db.update รันไปแล้ว)
    await this.auditLogService.log(undefined, {
      actionType: 'DELETE',
      moduleName: 'banners',
      recordId: id.toString(),
      oldData: oldBanner,
      remark: 'ลบแบนเนอร์ (Soft Delete)'
    }, { userId: parseInt(userId, 10) });

    return { success: true, message: 'ลบแบนเนอร์สำเร็จ' };
  }
}
