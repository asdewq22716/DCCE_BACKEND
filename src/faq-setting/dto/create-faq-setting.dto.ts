import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateFaqSettingDto {
  @ApiProperty({ description: 'หัวข้อคำถาม', example: 'วิธีการใช้งานระบบเบื้องต้น' })
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiProperty({ description: 'คำตอบ', example: 'สามารถดูคู่มือได้ที่หน้าดาวน์โหลดคู่มือ' })
  @IsNotEmpty()
  @IsString()
  answer: string;

  @ApiPropertyOptional({ description: 'สถานะการใช้งาน (1=เปิด, 0=ปิด)', example: 1 })
  @IsOptional()
  @IsNumber()
  is_active?: number;

  @ApiPropertyOptional({ description: 'ID รูปภาพแนบ (รับได้หลายรูป)', type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  image_ids?: number[];

  @ApiPropertyOptional({ description: 'หมายเหตุสำหรับการแก้ไข (Audit Log)', example: 'เพิ่มคำถามใหม่' })
  @IsOptional()
  @IsString()
  remark?: string;
}
