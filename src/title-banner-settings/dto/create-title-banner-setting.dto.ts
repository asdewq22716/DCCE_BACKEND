import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsArray, IsNumber } from 'class-validator';

export class CreateTitleBannerSettingDto {
  @ApiProperty({ description: 'สาขา' })
  @IsString()
  @IsNotEmpty()
  branch: string;

  @ApiProperty({ description: 'หัวข้อ' })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiPropertyOptional({ description: 'คำอธิบายภาษาไทย' })
  @IsString()
  @IsOptional()
  description_th?: string;

  @ApiPropertyOptional({ description: 'คำอธิบายภาษาอังกฤษ' })
  @IsString()
  @IsOptional()
  description_en?: string;

  @ApiPropertyOptional({ description: 'รูปภาพ (URL เดิม)' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({ description: 'รหัสรูปภาพที่อัปโหลด (Upload IDs)', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  image_ids?: number[];
}
