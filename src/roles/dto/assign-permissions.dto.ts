import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({ 
    description: 'รายการ ID สิทธิ์ย่อยทั้งหมดที่ต้องการผูกให้ Role นี้ (เป็นการเคลียร์สิทธิ์เก่าและแทนที่ด้วย Array ชุดนี้ทั้งหมด)', 
    example: [1, 2, 5, 8],
    type: [Number]
  })
  @IsNotEmpty({ message: 'รายการสิทธิ์ไม่สามารถเป็นค่าว่างได้' })
  @IsArray({ message: 'รายการสิทธิ์ต้องส่งมาเป็น Array' })
  @IsInt({
    each: true,
    message: 'รหัสสิทธิ์ (Permission ID) ต้องเป็นตัวเลขจำนวนเต็ม',
  })
  permissionIds: number[];

  @ApiProperty({ description: 'สถานะการใช้งานบทบาท (1 = ใช้งานปกติ, 0 = ปิดชั่วคราว)', example: 1, required: false })
  @IsOptional()
  @IsInt({ message: 'สถานะบทบาทต้องเป็นตัวเลขจำนวนเต็ม' })
  @IsIn([0, 1], { message: 'สถานะบทบาทต้องเป็น 0 หรือ 1 เท่านั้น' })
  role_status?: number;

  @ApiProperty({ description: 'ข้อความหมายเหตุ (กรณีปิดใช้งาน)', example: 'ปิดชั่วคราวเพื่อรอการตรวจสอบ', required: false })
  @IsOptional()
  @IsString({ message: 'หมายเหตุต้องเป็นข้อความ' })
  role_remark?: string;
}
