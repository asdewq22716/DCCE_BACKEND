import { IsString, IsOptional, Matches, IsInt, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ description: 'ชื่อบทบาทใหม่ที่ต้องการเปลี่ยน (ใส่แค่กรณีอยากเปลี่ยนชื่อ)', example: 'SENIOR_CREATOR', required: false })
  @IsOptional()
  @IsString({ message: 'ชื่อบทบาทต้องเป็นข้อความ' })
  @Matches(/^[A-Z0-9_]+$/, {
    message:
      'ชื่อบทบาทต้องเป็นภาษาอังกฤษตัวพิมพ์ใหญ่ ตัวเลข หรือเครื่องหมาย underline เท่านั้น (เช่น ADMIN, STAFF_MEMBER)',
  })
  role_name?: string;

  @ApiProperty({ description: 'คำอธิบายบทบาทใหม่', example: 'พนักงานผู้ดูแลระดับอาวุโส', required: false })
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
