import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AssignQueryDto {
  @ApiPropertyOptional({
    description: 'ค้นหาด้วยชื่อผู้ใช้งาน (ค้นหาแบบ LIKE)',
    example: 'สมชาย',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'กรองตามรหัสสาขาหลัก (Branch ID)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  branch_id?: string;

  @ApiPropertyOptional({
    description: 'กรองตามรหัสหน่วยงานย่อย (Unit ID)',
    example: '5',
  })
  @IsOptional()
  @IsString()
  unit_id?: string;
}
