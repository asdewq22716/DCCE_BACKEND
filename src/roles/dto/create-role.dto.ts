import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'ชื่อบทบาทไม่สามารถเป็นค่าว่างได้' })
  @IsString({ message: 'ชื่อบทบาทต้องเป็นข้อความ' })
  @Matches(/^[A-Z0-9_]+$/, {
    message:
      'ชื่อบทบาทต้องเป็นภาษาอังกฤษตัวพิมพ์ใหญ่ ตัวเลข หรือเครื่องหมาย underline เท่านั้น (เช่น ADMIN, STAFF_MEMBER)',
  })
  role_name: string;

  @IsOptional()
  @IsString({ message: 'รายละเอียดบทบาทต้องเป็นข้อความ' })
  description?: string;
}
