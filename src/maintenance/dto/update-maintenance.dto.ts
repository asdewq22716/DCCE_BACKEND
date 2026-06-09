import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMaintenanceDto {
  @ApiPropertyOptional({ description: 'วันที่ปิดปรับปรุงเริ่มต้น', example: '2024-01-01' })
  @Transform(({ value }) => value === '' ? null : value)
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'เวลาปิดปรับปรุงเริ่มต้น (HH:mm)', example: '02:00' })
  @Transform(({ value }) => value === '' ? null : value)
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'start_time must be a valid time in HH:mm format' })
  start_time?: string;

  @ApiPropertyOptional({ description: 'วันที่ปิดปรับปรุงสิ้นสุด', example: '2024-01-02' })
  @Transform(({ value }) => value === '' ? null : value)
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'เวลาปิดปรับปรุงสิ้นสุด (HH:mm)', example: '06:00' })
  @Transform(({ value }) => value === '' ? null : value)
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'end_time must be a valid time in HH:mm format' })
  end_time?: string;

  @ApiPropertyOptional({ description: 'จนกว่าจะกลับมาเปิดอีกครั้ง (1=ปิดไม่มีกำหนด, 0=มีกำหนด)', example: 0 })
  @IsInt()
  @IsOptional()
  is_indefinite?: number;

  @ApiPropertyOptional({ description: 'ปิด Service อัตโนมัติเมื่อถึงเวลาที่กำหนด (1=เปิดใช้งาน, 0=ปิดใช้งาน)', example: 1 })
  @IsInt()
  @IsOptional()
  auto_close_service?: number;

  @ApiPropertyOptional({ description: 'แจ้งเตือนผู้ดูแลระบบก่อนปิด Service (1=เปิดใช้งาน, 0=ปิดใช้งาน)', example: 1 })
  @IsInt()
  @IsOptional()
  notify_admin?: number;

  @ApiPropertyOptional({ description: 'แจ้งเตือนล่วงหน้า ... นาที', example: 30 })
  @IsInt()
  @IsOptional()
  notify_admin_minutes?: number;

  @ApiPropertyOptional({ description: 'หมายเหตุ', example: 'อัปเดตเซิร์ฟเวอร์ประจำเดือน' })
  @IsString()
  @IsOptional()
  remark?: string;
}
