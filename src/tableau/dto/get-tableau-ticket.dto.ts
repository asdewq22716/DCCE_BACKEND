import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// รายการ Dashboard ทั้งหมดที่รองรับ
export const TABLEAU_REPORT_CODES = ['REP01', 'REP02', 'REP03', 'REP04', 'REP05', 'REP06', 'REP07'] as const;
export type TableauReportCode = typeof TABLEAU_REPORT_CODES[number];

// Config รวมของ Tableau Reports
export const TABLEAU_REPORTS: Record<TableauReportCode, { path: string; name: string }> = {
  REP01: {
    path: '/views/REP01_/sheet0?:iid=1',
    name: 'รายงานระบบติดตามการจัดการทรัพยากรน้ำ',
  },
  REP02: {
    path: '/views/REP02_/sheet0?:iid=1',
    name: 'รายงานระบบติดตามการจัดเกษตร/ความมั่นคงทางอาหาร',
  },
  REP03: {
    path: '/views/REP03_/sheet0?:iid=1',
    name: 'รายงานระบบติดตามการท่องเที่ยว',
  },
  REP04: {
    path: '/views/REP04_/sheet0?:iid=2',
    name: 'รายงานระบบติดตามสาธารณสุข',
  },
  REP05: {
    path: '/views/REP05_/sheet0?:iid=2',
    name: 'รายงานระบบติดตามการจัดการทรัพยากรธรรมชาติ',
  },
  REP06: {
    path: '/views/REP06_/_V2?:iid=3',
    name: 'รายงานระบบติดตามการตั้งถิ่นฐาน/ความมั่นคงของมนุษย์',
  },
  REP07: {
    path: '/views/DCCEDATAQUALITY/DATAQUALITY?:iid=4',
    name: 'รายงานคุณภาพข้อมูล (Data Quality)',
  },
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
