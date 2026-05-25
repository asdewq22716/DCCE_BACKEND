import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class AssignOrgPermissionsDto {
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
