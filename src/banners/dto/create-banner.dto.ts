import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsDateString, IsNumber, IsArray } from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({ description: 'ชื่อแบนเนอร์ (ภาษาไทย)' })
  @IsNotEmpty()
  @IsString()
  title_th: string;

  @ApiProperty({ description: 'ชื่อแบนเนอร์ (ภาษาอังกฤษ)' })
  @IsNotEmpty()
  @IsString()
  title_en: string;

  @ApiPropertyOptional({ description: 'ลิงก์เป้าหมายเมื่อคลิกรูป' })
  @IsOptional()
  @IsString()
  link_url?: string;

  @ApiProperty({ description: 'วันที่เริ่มต้นแสดงผล (ISO String)', example: '2026-05-28T00:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({ description: 'วันที่สิ้นสุดแสดงผล (ISO String)', example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'เปิดใช้งาน จนกว่าจะกลับมาปิดอีกครั้ง (1 = เปิด, 0 = ปิด)', default: 0 })
  @IsOptional()
  @IsNumber()
  is_never_ends?: number;

  @ApiPropertyOptional({ description: 'ลำดับการแสดงผล', default: 1 })
  @IsOptional()
  @IsInt()
  sort_order?: number;

  @ApiPropertyOptional({ description: 'สถานะการใช้งาน (1 = เปิด, 0 = ปิด)', default: 1 })
  @IsOptional()
  @IsNumber()
  is_active?: number;

  @ApiProperty({ description: 'Array ID ของรูปภาพ PC ที่อัปโหลดไว้แล้วในตาราง uploads', type: [Number] })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  image_pc_ids: number[];

  @ApiProperty({ description: 'Array ID ของรูปภาพ Mobile ที่อัปโหลดไว้แล้วในตาราง uploads', type: [Number] })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  image_mobile_ids: number[];
}
