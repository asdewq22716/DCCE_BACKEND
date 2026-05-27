import { IsArray, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignUserRolesDto {
  @ApiProperty({
    description: 'รายการ ID ของตำแหน่ง (Role) ทั้งหมดที่ต้องการกำหนดให้ผู้ใช้งานคนนี้',
    example: [1, 2],
    type: [Number]
  })
  @IsNotEmpty({ message: 'รายการ Role ไม่สามารถเป็นค่าว่างได้' })
  @IsArray({ message: 'รายการ Role ต้องส่งมาเป็น Array' })
  @IsInt({
    each: true,
    message: 'รหัสตำแหน่ง (Role ID) ต้องเป็นตัวเลขจำนวนเต็ม',
  })
  roleIds: number[];
}
