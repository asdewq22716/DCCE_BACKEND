import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// รายการ Dashboard ทั้งหมดที่รองรับ
export const TABLEAU_REPORT_CODES = ['REP01', 'REP02', 'REP03', 'REP04', 'REP05', 'REP06'] as const;
export type TableauReportCode = typeof TABLEAU_REPORT_CODES[number];

// Mapping รหัส → Dashboard Path จริงใน Tableau
export const TABLEAU_DASHBOARD_PATHS: Record<TableauReportCode, string> = {
  REP01: '/views/REP01_/sheet0', // รายงานระบบติดตามการจัดการทรัพยากรน้ำ
  REP02: '/views/REP02_/sheet0', // รายงานระบบติดตามการจัดเกษตร: ความมั่นคงทางอาหาร
  REP03: '/views/REP03_/sheet0', // รายงานระบบติดตามการท่องเที่ยว
  REP04: '/views/REP04_/sheet0', // รายงานระบบติดตามสาธารณสุข
  REP05: '/views/REP05_/sheet0', // รายงานระบบติดตามทรัพยากรธรรมชาติ
  REP06: '/views/REP06_/_V2',   // รายงานระบบติดตั้งถึงฐาน: ความมั่นคงของมนุษย์
};

export class GetTableauTicketDto {
  @ApiProperty({
    description: 'รหัส Dashboard ที่ต้องการเปิด',
    example: 'REP01',
    enum: TABLEAU_REPORT_CODES,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(TABLEAU_REPORT_CODES, { message: `reportCode ต้องเป็นหนึ่งใน: ${TABLEAU_REPORT_CODES.join(', ')}` })
  reportCode: TableauReportCode;

  @ApiPropertyOptional({
    description: 'Username สำหรับ Tableau Trusted Auth (ถ้าไม่ระบุจะใช้ค่าจาก TABLEAU_USERNAME ใน env)',
    example: 'admin_dcce',
  })
  @IsString()
  @IsOptional()
  username?: string;
}
