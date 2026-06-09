import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSystemServiceDto {
  @ApiProperty({ description: 'ชื่อ Service เช่น รายงาน, ระบบจัดการผู้ใช้', example: 'รายงาน' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'หมายเหตุ', example: 'เปิดใช้งานเมื่อ 1 ม.ค.' })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: 'สิทธิ์ตามหน่วยงาน (0=ไม่เลือก, 1=เลือก)', example: 1 })
  @IsInt()
  @IsOptional()
  permission_by_org?: number;

  @ApiPropertyOptional({ description: 'สิทธิ์ตามบทบาทผู้ใช้งาน (0=ไม่เลือก, 1=เลือก)', example: 0 })
  @IsInt()
  @IsOptional()
  permission_by_role?: number;

  @ApiPropertyOptional({ description: 'จัดการสิทธิ์บุคคลภายนอก (0=ไม่เลือก, 1=เลือก)', example: 0 })
  @IsInt()
  @IsOptional()
  manage_external_permission?: number;

  @ApiPropertyOptional({ description: 'จัดการ Service ของระบบ (0=ไม่เลือก, 1=เลือก)', example: 0 })
  @IsInt()
  @IsOptional()
  manage_system_service?: number;

  @ApiPropertyOptional({ description: 'ประวัติการเปลี่ยนแปลง (0=ไม่เลือก, 1=เลือก)', example: 0 })
  @IsInt()
  @IsOptional()
  view_change_history?: number;

  @ApiPropertyOptional({ description: 'สถานะการใช้งาน (1=เปิดใช้งาน, 0=ปิดใช้งาน)', example: 1 })
  @IsInt()
  @IsOptional()
  is_active?: number;
}
