import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiObjectiveDto {
  @ApiProperty({ 
    description: 'ชื่อวัตถุประสงค์ (เช่น เพื่อวิเคราะห์ข้อมูลสภาพอากาศ)',
    example: 'เพื่อนำไปวิเคราะห์ในระบบพยากรณ์อากาศ'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ 
    description: 'สถานะการใช้งาน 1 = ใช้งาน, 0 = ไม่ใช้งาน', 
    default: 1,
    example: 1 
  })
  @IsNumber()
  @IsOptional()
  is_active?: number;
}
