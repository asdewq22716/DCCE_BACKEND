import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ResetUserOrgDto {
  @ApiPropertyOptional({
    description: 'หมายเหตุในการทำรายการรีเซ็ตสังกัดและสิทธิ์',
    example: 'ย้ายสายงาน / รีเซ็ตสิทธิ์เริ่มต้น',
  })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({
    description:
      'รีเซ็ตบทบาท (Global Roles) กลับเป็น USER เริ่มต้นด้วยหรือไม่ (true = ล้าง roles ทั้งหมดแล้วผูกเป็น USER, false = คง roles เดิมไว้)',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  reset_roles?: boolean;
}
