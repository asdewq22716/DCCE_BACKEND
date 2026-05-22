import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class OrgAccessDto {
  @ApiProperty({ description: 'ID ของผู้ใช้งาน (User ID)', example: 10 })
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({
    description:
      'ID ของหน่วยงานที่ต้องการเพิ่มสิทธิ์เข้าถึง (Organization ID)',
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  org_id: number;

  @ApiPropertyOptional({
    description: 'หมายเหตุในการเพิ่มสิทธิ์',
    example: 'เพิ่มสิทธิ์เข้าถึงข้อมูลสาขาระยอง',
  })
  @IsString()
  @IsOptional()
  remark?: string;
}
