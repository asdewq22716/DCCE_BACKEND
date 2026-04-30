import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ description: 'รหัสสิทธิ์ (เช่น user.view)', example: 'user.view' })
  @IsString()
  @IsNotEmpty()
  p_key: string;

  @ApiProperty({ description: 'ชื่อเรียกสิทธิ์ที่เข้าใจง่าย', example: 'ดูข้อมูลผู้ใช้งาน' })
  @IsString()
  @IsNotEmpty()
  p_label: string;

  @ApiProperty({ description: 'ID ของกลุ่มสิทธิ์', example: 1 })
  @IsNumber()
  @IsOptional()
  group_id?: number;
}
