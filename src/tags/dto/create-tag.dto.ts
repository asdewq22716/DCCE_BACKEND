import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ description: 'ชื่อแท็ก (ภาษาไทย)', example: 'ข่าวไอที' })
  @IsNotEmpty()
  @IsString()
  name_th: string;

  @ApiProperty({ description: 'ชื่อแท็ก (ภาษาอังกฤษ)', example: 'IT News' })
  @IsNotEmpty()
  @IsString()
  name_en: string;

  @ApiPropertyOptional({ description: 'สถานะการใช้งาน (1=เปิด, 0=ปิด)', example: 1 })
  @IsOptional()
  @IsNumber()
  is_active?: number;
}
