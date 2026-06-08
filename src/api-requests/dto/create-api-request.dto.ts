import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiRequestDto {
  @ApiProperty({ description: 'ID ของสาขา' })
  @IsNumber()
  @IsNotEmpty()
  branch_id: number;

  @ApiProperty({ description: 'ID ของหน่วยงาน' })
  @IsNumber()
  @IsNotEmpty()
  division_id: number;

  @ApiPropertyOptional({ description: 'URL ของระบบ' })
  @IsString()
  @IsOptional()
  app_url?: string;

  @ApiPropertyOptional({ description: 'ประเภทระบบ: Web Application (1=เลือก, 0=ไม่เลือก)', default: 0 })
  @IsNumber()
  @IsOptional()
  sys_web_app?: number;

  @ApiPropertyOptional({ description: 'ประเภทระบบ: Mobile Application (1=เลือก, 0=ไม่เลือก)', default: 0 })
  @IsNumber()
  @IsOptional()
  sys_mobile_app?: number;

  @ApiPropertyOptional({ description: 'ประเภทระบบ: Server-to-Server (1=เลือก, 0=ไม่เลือก)', default: 0 })
  @IsNumber()
  @IsOptional()
  sys_server_to_server?: number;

  @ApiPropertyOptional({ description: 'วัตถุประสงค์การใช้งาน (ข้อความ)' })
  @IsString()
  @IsOptional()
  objective_text?: string;

  @ApiPropertyOptional({ description: 'รายการ API: ข้อมูลสภาพภูมิอากาศ (1=เลือก, 0=ไม่เลือก)', default: 0 })
  @IsNumber()
  @IsOptional()
  api_climate_data?: number;

  @ApiPropertyOptional({ description: 'รายการ API: ข้อมูลสถานีตรวจวัด (1=เลือก, 0=ไม่เลือก)', default: 0 })
  @IsNumber()
  @IsOptional()
  api_station_data?: number;

  @ApiPropertyOptional({ description: 'รายการ API: ข้อมูลรายงานสถิติ (1=เลือก, 0=ไม่เลือก)', default: 0 })
  @IsNumber()
  @IsOptional()
  api_statistics_report?: number;

  @ApiPropertyOptional({ description: 'รายการ API: ข้อมูลแผนที่ภูมิอากาศ (1=เลือก, 0=ไม่เลือก)', default: 0 })
  @IsNumber()
  @IsOptional()
  api_climate_map?: number;

  @ApiPropertyOptional({ description: 'ID ของ Server IP Address' })
  @IsNumber()
  @IsOptional()
  server_ip_id?: number;

  @ApiPropertyOptional({ description: 'Callback / Redirect URL' })
  @IsString()
  @IsOptional()
  callback_url?: string;

  @ApiPropertyOptional({ description: 'Environment (Sandbox หรือ Production)', enum: ['Sandbox', 'Production'] })
  @IsString()
  @IsIn(['Sandbox', 'Production'])
  @IsOptional()
  environment?: string;

  @ApiPropertyOptional({ description: 'ความคิดเห็น / หมายเหตุ' })
  @IsString()
  @IsOptional()
  comment?: string;
}
