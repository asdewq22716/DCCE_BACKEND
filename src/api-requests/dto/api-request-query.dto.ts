import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApiRequestQueryDto {
  @ApiPropertyOptional({ description: 'คำค้นหา (เช่น Request ID หรือชื่อผู้ขอ)' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'สถานะ (เช่น pending, approved, rejected)' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'ID สาขา (ค้นหาจาก Dropdown)' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  branch_id?: number;

  @ApiPropertyOptional({ description: 'ID หน่วยงาน (ค้นหาจาก Dropdown)' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  division_id?: number;

  @ApiPropertyOptional({ description: 'วันที่ขอเริ่มต้น (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'วันที่ขอสิ้นสุด (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'หน้าที่', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'จำนวนรายการต่อหน้า', default: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
}
