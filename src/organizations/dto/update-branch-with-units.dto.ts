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
    description: 'รหัส ID ของแผนกย่อยเดิม (หากเป็นแผนกที่แอดมินกดเพิ่มมาใหม่ ให้ปล่อยเป็น null หรือไม่ส่งค่านี้มา)',
    example: 2,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  org_id?: number;

  @ApiProperty({
    description: 'ชื่อของหน่วยงานย่อย/แผนก',
    example: 'กองบริหารจัดการน้ำ (แก้ไขแล้ว)',
  })
  @IsString()
  @IsNotEmpty()
  org_name: string;

  @ApiProperty({
    description: 'ลำดับการแสดงผลของแผนก',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  sort_order?: number;
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
    description: 'รายชื่อหน่วยงานย่อยทั้งหมดในปัจจุบัน (แถวที่หายไปจากลิสต์นี้ จะถือว่าแอดมินกดลบออกจากตาราง และจะถูกลบออกใน DB อัตโนมัติ)',
    type: [UpdateUnitDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUnitDto)
  units: UpdateUnitDto[];
}
