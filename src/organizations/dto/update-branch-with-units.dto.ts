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
    description: 'รายชื่อหน่วยงานย่อยทั้งหมดในปัจจุบัน (แถวที่หายไปจากลิสต์นี้ จะถือว่าแอดมินกดลบออกจากตาราง และจะถูกย้ายเป็นสถานะ is_active = 0 ใน DB อัตโนมัติ)',
    type: [UpdateUnitDto],
    example: [
      { org_id: 2, org_name: 'กองบริหารจัดการน้ำ (แก้ไขแล้ว)', sort_order: 1, is_active: 1 },
      { org_id: 3, org_name: 'ศูนย์ภัยแล้งระดับเขต', sort_order: 2, is_active: 1 },
      { org_name: 'กองเทคโนโลยีสารสนเทศ (หน่วยงานเพิ่มใหม่)', sort_order: 3, is_active: 1 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUnitDto)
  units: UpdateUnitDto[];
}
