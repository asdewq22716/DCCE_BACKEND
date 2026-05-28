import { Injectable, Logger } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly db: FncDB) { }

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
  /**
   * ผูกไฟล์เข้ากับตารางต่างๆ และย้ายไฟล์ออกจากโฟลเดอร์ temp ไปยังโฟลเดอร์ปลายทาง
   * @example
   * await this.uploadsService.linkFiles({ uploadIds: [1, 2], refTable: 'banners', refId: 10, tag: 'pc', userId: '1' })
   */
  async linkFiles({
    uploadIds,
    refTable,
    refId,
    tag,
    userId,
    client
  }: {
    uploadIds: number[],
    refTable: string,
    refId: number,
    tag: string,
    userId: string,
    client?: any
  }) {
    if (!uploadIds || uploadIds.length === 0) return;

    // 1. ดึงข้อมูลไฟล์ทั้งหมดจาก DB
    const sql = `SELECT * FROM uploads WHERE id = ANY($1) AND is_active = 1`;
    const files = client ? await this.db.queryTx(client, sql, [uploadIds]) : await this.db.query(sql, [uploadIds]);

    if (files.length !== uploadIds.length) {
      throw new Error('พบไฟล์บางส่วนที่ระบุไม่ถูกต้องหรือถูกลบไปแล้ว');
    }

    // 2. สร้างโฟลเดอร์ปลายทางถ้ายังไม่มี
    const destDir = path.join(process.cwd(), 'public', 'uploads', refTable);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // 3. วนลูปย้ายไฟล์และอัปเดต DB
    for (const file of files) {
      let newUrlPath = file.path;

      // ถ้าย้ายมาจาก temp ให้ย้ายไฟล์ใน HDD ด้วย
      if (file.is_temp === 1) {
        const oldFilePath = path.join(process.cwd(), 'public', 'uploads', 'temp', file.saved_name);
        const newFilePath = path.join(destDir, file.saved_name);

        if (fs.existsSync(oldFilePath)) {
          try {
            fs.renameSync(oldFilePath, newFilePath);
            newUrlPath = `/uploads/${refTable}/${file.saved_name}`;
          } catch (error) {
            this.logger.error(`Failed to move file ${file.saved_name}:`, error);
            throw new Error(`ไม่สามารถย้ายไฟล์ ${file.saved_name} ได้`);
          }
        }
      }

      // 4. อัปเดตข้อมูลไฟล์ใน DB
      const sortOrder = uploadIds.indexOf(file.id) + 1; // ลำดับเริ่มที่ 1
      const updateData = {
        ref_table: refTable,
        ref_id: refId,
        tag: tag,
        is_temp: 0,
        sort_order: sortOrder,
        path: newUrlPath
      };

      if (client) {
        await this.db.update('uploads', updateData, { id: file.id }, client);
      } else {
        await this.db.update('uploads', updateData, { id: file.id });
      }
    }
  }

  /**
   * ยกเลิกการผูกไฟล์ (Soft Delete) ตามเงื่อนไขที่ระบุ
   * @example
   * // ลบรูป PC ทั้งหมดของแบนเนอร์ ID 5
   * await this.uploadsService.unlinkFiles({ refTable: 'banners', refId: 5, tag: 'pc', userId: '1' })
   */
  async unlinkFiles({
    refTable,
    refId,
    tag,
    userId,
    client
  }: {
    refTable: string,
    refId: number,
    tag?: string,
    userId: string,
    client?: any
  }) {
    // สร้าง WHERE clause แบบ Dynamic (ถ้าไม่ระบุ tag จะลบทุก tag ของ refTable/refId นั้นๆ)
    let sql = `
      UPDATE uploads
      SET is_active = 0, deleted_at = NOW(), deleted_by = $1
      WHERE ref_table = $2 AND ref_id = $3
    `;
    const params: any[] = [userId, refTable, refId];

    if (tag) {
      sql += ` AND tag = $${params.length + 1}`;
      params.push(tag);
    }

    if (client) {
      await this.db.queryTx(client, sql, params);
    } else {
      await this.db.query(sql, params);
    }
  }

  /**
   * คำนวณ Diff รูปภาพเก่า/ใหม่ และอัปเดตเฉพาะส่วนที่เปลี่ยนแปลงจริงๆ
   * @example
   * // รูปเก่า [1,2] + ส่งใหม่ [1,3] → ลบแค่ 2, เพิ่มแค่ 3, คง 1 ไว้เพราะไม่เปลี่ยน
   * await this.uploadsService.syncFiles({ newUploadIds: [1, 3], refTable: 'banners', refId: 5, tag: 'pc', userId: '1' })
   */
  async syncFiles({
    newUploadIds,
    refTable,
    refId,
    tag,
    userId,
    client
  }: {
    newUploadIds: number[],
    refTable: string,
    refId: number,
    tag: string,
    userId: string,
    client?: any
  }) {
    // 1. ดึงรูปภาพชุดเก่าที่ active อยู่ปัจจุบัน
    const sql = `SELECT id FROM uploads WHERE ref_table = $1 AND ref_id = $2 AND tag = $3 AND is_active = 1`;
    const currentFiles = client
      ? await this.db.queryTx(client, sql, [refTable, refId, tag])
      : await this.db.query(sql, [refTable, refId, tag]);

    const currentIds: number[] = currentFiles.map((f: any) => f.id);

    // 2. คำนวณ Diff
    const toRemove = currentIds.filter(oldId => !newUploadIds.includes(oldId));
    const toAdd    = newUploadIds.filter(newId => !currentIds.includes(newId));
    // (ส่วนที่เหมือนกันทั้งสองชุด ไม่ต้องทำอะไร)

    // 3. Soft Delete เฉพาะรูปที่ถูกลบออก
    for (const removeId of toRemove) {
      const removeSql = `UPDATE uploads SET is_active = 0, deleted_at = NOW(), deleted_by = $1 WHERE id = $2`;
      if (client) {
        await this.db.queryTx(client, removeSql, [userId, removeId]);
      } else {
        await this.db.query(removeSql, [userId, removeId]);
      }
    }

    // 4. Link เฉพาะรูปใหม่ที่ยังไม่เคยมี
    if (toAdd.length > 0) {
      await this.linkFiles({ uploadIds: toAdd, refTable, refId, tag, userId, client });
    }

    // 5. Update sort_order ให้ตรงกับลำดับใน newUploadIds
    for (let i = 0; i < newUploadIds.length; i++) {
      const updateOrderSql = `UPDATE uploads SET sort_order = $1 WHERE id = $2`;
      if (client) {
         await this.db.queryTx(client, updateOrderSql, [i + 1, newUploadIds[i]]);
      } else {
         await this.db.query(updateOrderSql, [i + 1, newUploadIds[i]]);
      }
    }
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

  /**
   * สร้าง SQL Subquery สำหรับดึงรูปภาพของตารางนั้นๆ ให้ออกมาเป็น JSON Array
   * ใช้เพื่อจัด Format ส่งออก (Export) ให้เหมือนกันทุก Module
   */
  buildFilesSubquery(refTable: string, refIdColumn: string, tag: string): string {
    return `(
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', u.id,
            'path', u.path,
            'original_name', u.original_name,
            'size', u.size,
            'mime_type', u.mime_type,
            'extension', u.extension,
            'sort_order', u.sort_order
          ) ORDER BY u.sort_order ASC
        ),
        '[]'
      )
      FROM uploads u 
      WHERE u.ref_table = '${refTable}' 
        AND u.ref_id = ${refIdColumn} 
        AND u.tag = '${tag}' 
        AND u.is_active = 1
    )`;
  }
}
