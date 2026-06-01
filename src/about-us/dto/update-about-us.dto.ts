import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class UpdateAboutUsDto {
  @ApiPropertyOptional({ description: 'หัวข้อหลัก (ภาษาไทย)', example: 'เกี่ยวกับบริษัทของเรา' })
  @IsOptional()
  @IsString()
  topic_th?: string;

  @ApiPropertyOptional({ description: 'หัวข้อหลัก (ภาษาอังกฤษ)', example: 'About Our Company' })
  @IsOptional()
  @IsString()
  topic_en?: string;

  @ApiPropertyOptional({ description: 'รายละเอียด (ภาษาไทย)', example: 'เราคือผู้นำด้านเทคโนโลยีสารสนเทศที่มุ่งเน้นการส่งมอบโซลูชันที่ดีที่สุดเพื่อขับเคลื่อนธุรกิจของคุณ' })
  @IsOptional()
  @IsString()
  detail_th?: string;

  @ApiPropertyOptional({ description: 'รายละเอียด (ภาษาอังกฤษ)', example: 'We are a leading IT company focused on delivering the best solutions to drive your business forward.' })
  @IsOptional()
  @IsString()
  detail_en?: string;

  @ApiPropertyOptional({ description: 'ข้อความ Background ขนาดใหญ่ (ภาษาไทย)', example: 'สร้างสรรค์นวัตกรรมสู่อนาคต' })
  @IsOptional()
  @IsString()
  bg_text_th?: string;

  @ApiPropertyOptional({ description: 'ข้อความ Background ขนาดใหญ่ (ภาษาอังกฤษ)', example: 'Innovating for the Future' })
  @IsOptional()
  @IsString()
  bg_text_en?: string;

  @ApiPropertyOptional({ description: 'ID รูปภาพ (รับได้สูงสุด 5 รูป)', type: [Number], example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  image_ids?: number[];
}
