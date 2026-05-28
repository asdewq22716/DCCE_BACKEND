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

// ตัวจัดการการเก็บไฟล์ชั่วคราว (Temp Storage)
export const tempStorageOptions = {
  storage: diskStorage({
    destination: (req: any, file: Express.Multer.File, cb: any) => {
      const tempPath = './public/uploads/temp';
      ensureDirExists(tempPath);
      cb(null, tempPath);
    },
    filename: (req: any, file: Express.Multer.File, cb: any) => {
      // สร้างชื่อไฟล์ใหม่เป็น UUID
      const uniqueSuffix = uuidv4();
      const ext = extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  })
};
