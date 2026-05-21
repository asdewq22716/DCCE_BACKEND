import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({
    description: 'ชื่อของหน่วยงานย่อย',
    example: 'กองบริหารจัดการน้ำ',
  })
  @IsString()
  @IsNotEmpty()
  org_name: string;

  @ApiProperty({
    description: 'รหัสสาขาหลักที่เป็นแม่ข่าย (ถ้ามี)',
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
}
