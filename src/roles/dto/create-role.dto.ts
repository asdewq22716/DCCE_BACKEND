import { IsNotEmpty, IsString, IsOptional, Matches, IsInt, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'ชื่อบทบาท ต้องเป็นภาษาอังกฤษตัวพิมพ์ใหญ่ ตัวเลข หรือ underscore (ห้ามมีช่องว่าง)', example: 'CONTENT_CREATOR' })
  @IsNotEmpty({ message: 'ชื่อบทบาทไม่สามารถเป็นค่าว่างได้' })
  @IsString({ message: 'ชื่อบทบาทต้องเป็นข้อความ' })
  @Matches(/^[A-Z0-9_]+$/, {
    message:
      'ชื่อบทบาทต้องเป็นภาษาอังกฤษตัวพิมพ์ใหญ่ ตัวเลข หรือเครื่องหมาย underline เท่านั้น (เช่น ADMIN, STAFF_MEMBER)',
  })
  role_name: string;

  @ApiProperty({ description: 'คำอธิบายบทบาท (มีหรือไม่มีก็ได้)', example: 'พนักงานผู้ดูแลการจัดการเนื้อหาในระบบ', required: false })
  @IsOptional()
  @IsString({ message: 'รายละเอียดบทบาทต้องเป็นข้อความ' })
  description?: string;

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
