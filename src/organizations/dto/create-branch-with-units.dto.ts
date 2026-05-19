import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UnitItemDto {
  @ApiProperty({
    description: 'ลำดับการแสดงผลของหน่วยงานในระบบหน้าจอ (เรียงลำดับจากน้อยไปมาก)',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  sort_order: number;

  @ApiProperty({
    description: 'ชื่อของหน่วยงานย่อย',
    example: 'กองบริหารจัดการน้ำ',
  })
  @IsString()
  @IsNotEmpty()
  org_name: string;
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
      { org_name: 'กองบริหารจัดการน้ำ', sort_order: 1 },
      { org_name: 'ศูนย์เฝ้าระวังภัยแล้ง', sort_order: 2 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitItemDto)
  units: UnitItemDto[];
}
