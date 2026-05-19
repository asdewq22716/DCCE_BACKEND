import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditLogQueryDto {
  @ApiProperty({
    description: 'หมายเลขหน้า (สำหรับแบ่งหน้า)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({
    description: 'จำนวนรายการต่อหน้า',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiProperty({
    description: 'กรองด้วยชื่อโมดูล (เช่น organizations)',
    example: 'organizations',
    required: false,
  })
  @IsOptional()
  @IsString()
  moduleName?: string;

  @ApiProperty({
    description: 'กรองด้วยประเภทการกระทำ (CREATE, UPDATE, DELETE)',
    example: 'UPDATE',
    required: false,
  })
  @IsOptional()
  @IsString()
  actionType?: string;

  @ApiProperty({
    description: 'กรองด้วยรหัสของข้อมูลหลัก (Record ID)',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  recordId?: string;

  @ApiProperty({
    description: 'กรองด้วย ID ผู้ใช้งานที่เป็นคนสร้างบันทึก',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  createdBy?: number;

  @ApiProperty({
    description: 'วันที่เริ่มต้นในการกรองประวัติ (ISO Date String)',
    example: '2026-05-19T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'วันที่สิ้นสุดในการกรองประวัติ (ISO Date String)',
    example: '2026-05-19T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'คำค้นหาเบื้องต้น (ค้นหาจากช่องหมายเหตุ remark หรือชื่อโมดูล)',
    example: 'ปรับโครงสร้าง',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
