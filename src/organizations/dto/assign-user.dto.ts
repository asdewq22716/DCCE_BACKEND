import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AssignUserDto {
  @ApiProperty({ description: 'ID ของผู้ใช้งาน (User ID)', example: 10 })
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({
    description: 'ID ของหน่วยงานที่ต้องการนำผู้ใช้เข้าสังกัด (Organization ID)',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  org_id: number;
}
