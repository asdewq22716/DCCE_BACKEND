import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApiRequestQueryDto {
  @ApiPropertyOptional({ description: 'ค้นหาด้วยชื่อระบบ หรือ Request ID' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'สถานะ (เช่น pending, approved, rejected)' })
  @IsString()
  @IsOptional()
  status?: string;

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
