import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncPermissionItemDto {
  @ApiProperty({ description: 'ID ของสิทธิ์ (ถ้ามีแปลว่าของเก่า)', required: false })
  @IsNumber()
  @IsOptional()
  permission_id?: number;

  @ApiProperty({ description: 'รหัสสิทธิ์', example: 'user.view' })
  @IsString()
  @IsNotEmpty()
  p_key: string;

  @ApiProperty({ description: 'ชื่อเรียกสิทธิ์', example: 'ดูข้อมูลผู้ใช้งาน' })
  @IsString()
  @IsNotEmpty()
  p_label: string;
}

export class SyncGroupDto {
  @ApiProperty({ description: 'ID ของกลุ่ม (ถ้ามีแปลว่าของเก่า)', required: false })
  @IsNumber()
  @IsOptional()
  group_id?: number;

  @ApiProperty({ description: 'ชื่อกลุ่มสิทธิ์', example: 'จัดการผู้ใช้งาน' })
  @IsString()
  @IsNotEmpty()
  group_name: string;

  @ApiProperty({ description: 'ลำดับการแสดงผล', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @ApiProperty({
    description: 'รายการสิทธิ์ย่อยที่จะอยู่ในกลุ่มนี้',
    type: [SyncPermissionItemDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SyncPermissionItemDto)
  permissions?: SyncPermissionItemDto[];

  @ApiProperty({
    description: 'กลุ่มย่อยที่ซ้อนอยู่ข้างใน (Recursive)',
    type: [SyncGroupDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SyncGroupDto)
  children?: SyncGroupDto[];
}

export class SyncPermissionsDto {
  @ApiProperty({
    description: 'โครงสร้างสิทธิ์ทั้งหมด (รูปแบบ Tree)',
    type: [SyncGroupDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncGroupDto)
  children: SyncGroupDto[];

  @ApiProperty({
    description: 'ID ของกลุ่มที่ต้องการลบทิ้ง',
    type: [Number],
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  deleted_groups?: number[];

  @ApiProperty({
    description: 'ID ของสิทธิ์ย่อยที่ต้องการลบทิ้ง',
    type: [Number],
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  deleted_permissions?: number[];
}
