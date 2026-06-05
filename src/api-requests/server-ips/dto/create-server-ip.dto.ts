import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServerIpDto {
  @ApiProperty({ 
    description: 'IP Address (เช่น 10.10.10.10)',
    example: '192.168.1.100'
  })
  @IsString()
  @IsNotEmpty()
  ip_address: string;

  @ApiPropertyOptional({ 
    description: 'สถานะการใช้งาน 1 = ใช้งาน, 0 = ไม่ใช้งาน', 
    default: 1,
    example: 1
  })
  @IsNumber()
  @IsOptional()
  is_active?: number;
}
