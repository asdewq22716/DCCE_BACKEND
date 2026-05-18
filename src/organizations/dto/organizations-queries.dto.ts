import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// 🌟 คลาสรวม Query สำหรับดึงสาขาหลัก (ดึงเดี่ยว/ดึงทั้งหมดพ่วงแผนกย่อย)
export class BranchQueryDto {
  @ApiPropertyOptional({
    description: 'รหัสสาขาหลัก (หากไม่ระบุจะดึงสาขาทั้งหมดพร้อมแผนกย่อย)',
    type: String,
    example: '18',
  })
  @IsOptional()
  @IsString()
  id?: string;
}
