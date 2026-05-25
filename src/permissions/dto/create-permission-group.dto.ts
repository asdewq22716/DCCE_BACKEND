import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePermissionGroupDto {
  @ApiProperty({
    description: 'ชื่อกลุ่มสิทธิ์ (เช่น ระบบสมาชิก, รายงาน)',
    example: 'ระบบสมาชิก',
  })
  @IsString()
  @IsNotEmpty()
  group_name: string;

  @ApiProperty({ description: 'ลำดับการแสดงผล', example: 1 })
  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @ApiProperty({
    description: 'ID ของกลุ่มแม่ (ถ้ามี)',
    example: null,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  parent_id?: number;
}
