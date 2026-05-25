import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class AssignOrgPermissionsDto {
  @ApiProperty({
    description: 'สถานะการใช้งานสิทธิ์ของหน่วยงานนี้ (1 = เปิด, 0 = ปิดชั่วคราว)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  is_active?: number;

  @ApiPropertyOptional({
    description: 'หมายเหตุการตั้งค่าสิทธิ์ของหน่วยงานนี้ (ถ้ามี)',
    example: 'ปิดการใช้งานสิทธิ์ชั่วคราว',
  })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiProperty({
    description: 'รายการ ID ฟังก์ชันการใช้งานที่ต้องการผูกกับหน่วยงานนี้',
    example: [1, 2, 5],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  permission_ids: number[];
}
