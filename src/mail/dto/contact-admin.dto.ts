import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactAdminDto {
  @ApiPropertyOptional({ description: 'หัวข้อที่ต้องการสอบถาม (ถ้าไม่ระบุจะใช้ค่า Default)', example: 'สอบถามการใช้งาน' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'รายละเอียดข้อความ', example: 'อยากทราบว่าถ้าจะขอ API เส้น Dashboard ต้องทำอย่างไรบ้างครับ?' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
