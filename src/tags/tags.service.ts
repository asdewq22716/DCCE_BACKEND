import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly db: FncDB) {}

  async create(createDto: CreateTagDto, userId: string) {
    try {
      const tagData = {
        name_th: createDto.name_th,
        name_en: createDto.name_en,
        is_active: createDto.is_active ?? 1,
        created_by: userId,
        updated_by: userId
      };

      const result = await this.db.insert('master_tags', tagData);
      return { success: true, id: result.id, message: 'สร้างแท็กสำเร็จ' };
    } catch (error: any) {
      this.logger.error(`Failed to create tag: ${error.message}`, error.stack);
      throw new BadRequestException('เกิดข้อผิดพลาดในการสร้างแท็ก');
    }
  }

  async findAll() {
    const sql = `
      SELECT * FROM master_tags 
      WHERE deleted_at IS NULL 
      ORDER BY name_th ASC
    `;
    return await this.db.query(sql);
  }

  async findOne(id: number) {
    const sql = `
      SELECT * FROM master_tags 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.db.query(sql, [id]);
    
    if (!result || result.length === 0) {
      throw new NotFoundException('ไม่พบแท็กนี้');
    }
    return result[0];
  }

  async update(id: number, updateDto: UpdateTagDto, userId: string) {
    await this.findOne(id); // ตรวจสอบว่ามีอยู่ไหม

    try {
      const updateData: any = {};
      if (updateDto.name_th !== undefined) updateData.name_th = updateDto.name_th;
      if (updateDto.name_en !== undefined) updateData.name_en = updateDto.name_en;
      if (updateDto.is_active !== undefined) updateData.is_active = updateDto.is_active;
      
      updateData.updated_by = userId;
      updateData.updated_at = new Date();

      if (Object.keys(updateData).length > 2) {
        await this.db.update('master_tags', updateData, { id });
      }

      return { success: true, message: 'อัปเดตข้อมูลสำเร็จ' };
    } catch (error: any) {
      this.logger.error(`Failed to update tag: ${error.message}`, error.stack);
      throw new BadRequestException('เกิดข้อผิดพลาดในการอัปเดตแท็ก');
    }
  }

  async remove(id: number, userId: string) {
    await this.findOne(id);

    try {
      await this.db.update('master_tags', {
        is_active: 0,
        deleted_at: new Date(),
        deleted_by: userId
      }, { id });

      return { success: true, message: 'ลบข้อมูลสำเร็จ' };
    } catch (error: any) {
      this.logger.error(`Failed to delete tag: ${error.message}`, error.stack);
      throw new BadRequestException('เกิดข้อผิดพลาดในการลบแท็ก');
    }
  }
}
