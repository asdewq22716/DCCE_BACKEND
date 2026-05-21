import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn } from 'class-validator';

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

  @ApiProperty({
    description: 'ระดับการเข้าถึงข้อมูลของหน่วยงานย่อย (1=เข้าถึงเฉพาะข้อมูลของหน่วยงานตนเอง, 2=เข้าถึงข้อมูลระดับกรม/กระทรวง, 3=เข้าถึงข้อมูลระดับประเทศ)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @IsIn([1, 2, 3], { message: 'ระดับการเข้าถึงข้อมูลต้องเป็นค่า 1, 2 หรือ 3 เท่านั้น' })
  unit_data_permissions?: number;

  @ApiProperty({
    description: 'ดูข้อมูลดัชนีภูมิอากาศ (0=เลือก, 1=ไม่เลือก)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @IsIn([0, 1], { message: 'ค่าสิทธิ์ดูข้อมูลดัชนีภูมิอากาศต้องเป็น 0 หรือ 1 เท่านั้น' })
  unit_view_climate_index?: number;

  @ApiProperty({
    description: 'ดูข้อมูลการปล่อยก๊าซเรือนกระจก (0=เลือก, 1=ไม่เลือก)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @IsIn([0, 1], { message: 'ค่าสิทธิ์ดูข้อมูลการปล่อยก๊าซเรือนกระจกต้องเป็น 0 หรือ 1 เท่านั้น' })
  unit_view_ghg_emissions?: number;

  @ApiProperty({
    description: 'แก้ไขข้อมูลย้อนหลัง (0=เลือก, 1=ไม่เลือก)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @IsIn([0, 1], { message: 'ค่าสิทธิ์แก้ไขข้อมูลย้อนหลังต้องเป็น 0 หรือ 1 เท่านั้น' })
  unit_edit_historical_data?: number;

  @ApiProperty({
    description: 'อนุมัติการเผยแพร่ข้อมูลสาธารณะ (0=เลือก, 1=ไม่เลือก)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @IsIn([0, 1], { message: 'ค่าสิทธิ์อนุมัติการเผยแพร่ข้อมูลสาธารณะต้องเป็น 0 หรือ 1 เท่านั้น' })
  unit_approve_public_data?: number;

  @ApiProperty({
    description: 'หมายเหตุของหน่วยงานย่อย',
    example: 'หมายเหตุเพิ่มเติม',
    required: false,
  })
  @IsString()
  @IsOptional()
  unit_remark?: string;
}
