import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactPublicDto {
  @ApiPropertyOptional({ description: 'หัวข้อที่ต้องการสอบถาม', example: 'สอบถามข้อมูลบริการ' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'รายละเอียดข้อความ', example: 'ต้องการสอบถามรายละเอียดเพิ่มเติม...' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'ชื่อผู้ส่ง', example: 'สมชาย ใจดี' })
  @IsString()
  @IsNotEmpty()
  senderName: string;

  @ApiProperty({ description: 'เบอร์โทร', example: '0812345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'อีเมล', example: 'somchai@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
