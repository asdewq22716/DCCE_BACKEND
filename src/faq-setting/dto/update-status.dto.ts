import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ description: 'สถานะ (1 = เปิดใช้งาน, 0 = ปิดใช้งาน)', example: 1 })
  @IsNumber()
  @IsIn([0, 1])
  is_active: number;
}
