import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UpdateUnitDetailDto {
  @ApiProperty({
    description: 'ชื่อของหน่วยงานย่อย (ถ้าต้องการแก้ไข)',
    example: 'กองบริหารจัดการน้ำ (แก้ไข)',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  org_name?: string;

  @ApiProperty({
    description: 'รหัสสาขาหลักที่เป็นแม่ข่าย',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  parent_id?: number;

  @ApiProperty({
    description: 'ลำดับการแสดงผลของหน่วยงาน',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @ApiProperty({
    description: 'สถานะการใช้งาน (1 = เปิดใช้งานปกติ, 0 = ถูกลบ/ปิดใช้งาน)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  is_active?: number;
}
