import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UpdateOrgDto {
  @ApiProperty({
    description: 'ชื่อหน่วยงาน หรือ ชื่อสาขาที่ต้องการแก้ไข',
    example: 'สาขาระยอง (ปรับปรุง)',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  org_name?: string;

  @ApiProperty({
    description: 'ID ของหน่วยงานที่เป็นแม่ข่าย กรณีต้องการย้ายสังกัดย่อย',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  parent_id?: number;
}
