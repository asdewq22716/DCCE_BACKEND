import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateApiRequestDto } from './create-api-request.dto';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateApiRequestDto extends PartialType(CreateApiRequestDto) {}

export class UpdateApiRequestStatusDto {
  @ApiPropertyOptional({ description: 'สถานะ (pending, approved, rejected)' })
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'ความคิดเห็น/เหตุผล (ถ้ามี)' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'วันที่เริ่มต้นใช้งาน API (แอดมินเป็นคนกรอกตอนอนุมัติ)' })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'วันที่สิ้นสุดการใช้งาน API (แอดมินเป็นคนกรอกตอนอนุมัติ)' })
  @IsString()
  @IsOptional()
  end_date?: string;
}
