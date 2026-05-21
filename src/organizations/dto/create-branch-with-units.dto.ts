import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UnitItemDto {
  @ApiProperty({
    description: 'รหัส ID ของหน่วยงานย่อย',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  org_id: number;

  @ApiProperty({
    description:
      'ลำดับการแสดงผลของหน่วยงานในระบบหน้าจอ (เรียงลำดับจากน้อยไปมาก)',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  sort_order: number;
}

export class CreateBranchWithUnitsDto {
  @ApiProperty({
    description: 'ชื่อสาขาหลักที่จะเพิ่มใหม่',
    example: 'สาขาระยอง',
  })
  @IsString()
  @IsNotEmpty()
  branch_name: string;

  @ApiProperty({
    description: 'รายการหน่วยงานย่อยทั้งหมดที่สร้างพร้อมสาขานี้',
    type: [UnitItemDto],
    example: [
      { org_id: 1, sort_order: 1 },
      { org_id: 2, sort_order: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitItemDto)
  units: UnitItemDto[];
}
