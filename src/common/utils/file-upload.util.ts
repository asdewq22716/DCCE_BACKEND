import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';

// ตรวจสอบและสร้างโฟลเดอร์ถ้ายังไม่มี
export const ensureDirExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * แก้ชื่อไฟล์ภาษาไทยแตก:
 * Multer อ่านชื่อไฟล์จาก HTTP Header ด้วย Latin1 (ISO-8859-1)
 * แต่ Browser ส่งมาเป็น UTF-8 → ต้อง re-encode กลับให้ถูกต้อง
 */
export const decodeOriginalName = (name: string): string => {
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name; // ถ้า decode ไม่ได้ให้ใช้ชื่อเดิม
  }
};

// ตัวจัดการการเก็บไฟล์ชั่วคราว (Temp Storage)
export const tempStorageOptions = {
  storage: diskStorage({
    destination: (req: any, file: Express.Multer.File, cb: any) => {
      // Patch originalname ให้เป็น UTF-8 ตั้งแต่ต้น เพื่อให้ทุก callback ได้ชื่อที่ถูกต้อง
      file.originalname = decodeOriginalName(file.originalname);
      const tempPath = './public/uploads/temp';
      ensureDirExists(tempPath);
      cb(null, tempPath);
    },
    filename: (req: any, file: Express.Multer.File, cb: any) => {
      // สร้างชื่อไฟล์ใหม่เป็น UUID (originalname ถูก decode แล้วตั้งแต่ destination)
      const uniqueSuffix = uuidv4();
      const ext = extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // กำหนดขนาดไฟล์สูงสุดที่ 100MB
  },
};
