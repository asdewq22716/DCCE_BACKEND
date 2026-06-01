import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsDateString } from 'class-validator';

export class CreateNewsSettingDto {
  @ApiProperty({ description: 'ชื่อข่าวประชาสัมพันธ์ (ภาษาไทย)', example: 'หัวข้อข่าวใหม่' })
  @IsNotEmpty()
  @IsString()
  title_th: string;

  @ApiProperty({ description: 'ชื่อข่าวประชาสัมพันธ์ (ภาษาอังกฤษ)', example: 'New Breaking News' })
  @IsNotEmpty()
  @IsString()
  title_en: string;

  @ApiPropertyOptional({ description: 'รายละเอียดข่าว (ภาษาไทย)' })
  @IsOptional()
  @IsString()
  detail_th?: string;

  @ApiPropertyOptional({ description: 'รายละเอียดข่าว (ภาษาอังกฤษ)' })
  @IsOptional()
  @IsString()
  detail_en?: string;

  @ApiPropertyOptional({ description: 'แท็ก (Tags) ส่งมาเป็น Array ของ String', type: [String], example: ['IT', 'News'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'ลิงก์เป้าหมาย' })
  @IsOptional()
  @IsString()
  link_url?: string;

  @ApiProperty({ description: 'วันที่เริ่มต้น', example: '2026-06-01T00:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({ description: 'วันที่สิ้นสุด', example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'ไม่มีวันสิ้นสุด (1=ใช่, 0=ไม่ใช่)', example: 0 })
  @IsOptional()
  @IsNumber()
  is_never_ends?: number;

  @ApiPropertyOptional({ description: 'สถานะแสดงผล (1=แสดง, 0=ซ่อน)', example: 1 })
  @IsOptional()
  @IsNumber()
  is_active?: number;

  @ApiPropertyOptional({ description: 'ID รูปภาพ (รับเป็น Array)', type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  image_ids?: number[];
}
