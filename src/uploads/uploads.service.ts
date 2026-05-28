import { Injectable, Logger } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly db: FncDB) {}

  async saveTempFile(file: Express.Multer.File, createdBy?: string) {
    // กำหนด URL สำหรับเข้าถึงไฟล์
    const url = `/uploads/temp/${file.filename}`;

    const insertData = {
      original_name: file.originalname,
      saved_name: file.filename,
      path: url,
      mime_type: file.mimetype,
      size: file.size,
      extension: path.extname(file.originalname),
      is_temp: 1, // 1 = ไฟล์ชั่วคราว
      created_by: createdBy || 'system',
      is_active: 1
    };

    const record = await this.db.insert('uploads', insertData);

    return {
      id: record.id,
      original_name: record.original_name,
      url: record.path,
      mime_type: record.mime_type,
      size: record.size
    };
  }

  // Cron Job รันทุกเที่ยงคืนเพื่อลบไฟล์ Temp ที่อายุเกิน 24 ชั่วโมง
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleTempFileCleanup() {
    this.logger.log('Running Temp File Cleanup...');
    
    // หาข้อมูลจาก DB ที่เก็บมานานกว่า 1 วันและยังเป็น temp
    const sql = `
      SELECT id, saved_name 
      FROM uploads 
      WHERE is_temp = 1 
        AND created_at < NOW() - INTERVAL '1 day'
    `;
    const oldFiles = await this.db.query(sql);

    if (oldFiles.length === 0) {
      this.logger.log('No old temp files to clean up.');
      return;
    }

    let deletedCount = 0;
    for (const file of oldFiles) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'temp', file.saved_name);
      
      // ลบไฟล์ในระบบไฟล์ (HDD)
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          this.logger.error(`Failed to delete file: ${filePath}`, error);
        }
      }

      // ลบข้อมูลจาก Database (หรือจะใช้ Soft Delete คือ update is_active = 0 ก็ได้ แต่ขยะแนะนำลบทิ้งเลย)
      await this.db.delete('uploads', { id: file.id });
      deletedCount++;
    }

    this.logger.log(`Cleaned up ${deletedCount} old temp files.`);
  }
}
