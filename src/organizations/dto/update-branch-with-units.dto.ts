import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUnitDto {
  @ApiProperty({
    description: 'รหัส ID ของหน่วยงานย่อย',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  org_id: number;

  @ApiProperty({
    description: 'ลำดับการแสดงผลของแผนก',
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

export class UpdateBranchWithUnitsDto {
  @ApiProperty({
    description: 'ID ของสาขาหลักที่ต้องการแก้ไข',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  branch_id: number;

  @ApiProperty({
    description: 'ชื่อสาขาหลัก/สำนักงานหลัก',
    example: 'สาขาระยอง (สำนักงานใหญ่)',
  })
  @IsString()
  @IsNotEmpty()
  branch_name: string;

  @ApiProperty({
    description: 'สถานะการใช้งาน (1 = เปิดใช้งานปกติ, 0 = ถูกลบ/ปิดใช้งาน)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  is_active?: number;

  @ApiProperty({
    description: 'หมายเหตุ / เหตุผลในการแก้ไขปรับปรุงโครงสร้างองค์กรรอบนี้',
    example: 'ปรับปรุงชื่อหน่วยงานย่อยและสลับลำดับการแสดงผล',
  })
  @IsString()
  @IsNotEmpty()
  remark: string;

  @ApiProperty({
    description:
      'รายชื่อหน่วยงานย่อยที่ต้องการเพิ่ม แก้ไข หรือปิดใช้งาน (ส่งเฉพาะรายการที่ต้องการเปลี่ยนแปลงได้ แถวที่ไม่ได้ส่งมาจะไม่ได้รับผลกระทบใด ๆ)',
    type: [UpdateUnitDto],
    required: false,
    example: [
      { org_id: 2, sort_order: 1, is_active: 1 },
      { org_id: 3, sort_order: 2, is_active: 0 },
    ],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateUnitDto)
  units?: UpdateUnitDto[];
}
