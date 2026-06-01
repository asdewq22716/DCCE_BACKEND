import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class UpdateManualDto {
  @ApiPropertyOptional({ description: 'หมายเหตุ (ถ้ามี)', example: 'กรุณาดาวน์โหลดเอกสารอัปเดตล่าสุด' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ description: 'ID ไฟล์เอกสาร (ภาษาไทย) รับหลายไฟล์', type: [Number], example: [12, 14] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  file_th_ids?: number[];

  @ApiPropertyOptional({ description: 'ID ไฟล์เอกสาร (ภาษาอังกฤษ) รับหลายไฟล์', type: [Number], example: [13, 15] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  file_en_ids?: number[];
}
