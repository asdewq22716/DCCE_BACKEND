import { Controller, Get, Post, Body, Param, Redirect, HttpException, HttpStatus } from '@nestjs/common';
import { TableauService } from './tableau.service';
import { GetTableauTicketDto, TABLEAU_REPORT_CODES, TABLEAU_DASHBOARD_PATHS } from './dto/get-tableau-ticket.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// ชื่อแสดงผลภาษาไทยของแต่ละ Dashboard
const TABLEAU_REPORT_LABELS: Record<string, string> = {
  REP01: 'รายงานระบบติดตามการจัดการทรัพยากรน้ำ',
  REP02: 'รายงานระบบติดตามการจัดเกษตร: ความมั่นคงทางอาหาร',
  REP03: 'รายงานระบบติดตามการท่องเที่ยว',
  REP04: 'รายงานระบบติดตามสาธารณสุข',
  REP05: 'รายงานระบบติดตามทรัพยากรธรรมชาติ',
  REP06: 'รายงานระบบติดตั้งถึงฐาน: ความมั่นคงของมนุษย์',
};

@ApiTags('Tableau')
@Controller('tableau')
export class TableauController {
  constructor(private readonly tableauService: TableauService) {}

  // ──────────────────────────────────────────────────
  // GET /tableau/reports  →  รายการ Dashboard ทั้งหมด (สำหรับทำ Dropdown)
  // ──────────────────────────────────────────────────
  @Get('reports')
  @ApiOperation({ summary: 'ดึงรายการ Dashboard ทั้งหมด (สำหรับทำ Dropdown ฝั่ง Frontend)' })
  @ApiResponse({
    status: 200,
    description: 'รายการ Dashboard พร้อม reportCode, label, และ path',
    schema: {
      example: [
        {
          reportCode: 'REP01',
          label: 'รายงานระบบติดตามการจัดการทรัพยากรน้ำ',
          dashboardPath: '/views/REP01_/sheet0',
        },
      ],
    },
  })
  getReports() {
    const reports = TABLEAU_REPORT_CODES.map((code) => ({
      reportCode: code,
      label: TABLEAU_REPORT_LABELS[code],
      dashboardPath: TABLEAU_DASHBOARD_PATHS[code],
    }));
    return reports;
  }

  // ──────────────────────────────────────────────────
  // POST /tableau/trusted-url  →  สร้าง Trusted URL สำหรับเปิด Dashboard
  // ──────────────────────────────────────────────────
  @Post('trusted-url')
  @ApiOperation({ summary: 'สร้าง Tableau Trusted URL (Frontend เอา URL ไปเปิดใน iframe เอง)' })
  @ApiResponse({
    status: 201,
    description: 'URL สำเร็จ',
    schema: {
      example: {
        success: true,
        url: 'http://192.168.65.58/trusted/abc12345/views/REP01_/sheet0',
      },
    },
  })
  async getTrustedUrl(@Body() dto: GetTableauTicketDto) {
    return await this.tableauService.getTrustedUrl(dto);
  }

  // ──────────────────────────────────────────────────
  // GET /tableau/dashboard/:reportCode
  // Backend ขอ ticket เอง → Redirect ไป Tableau ทันที
  // ทดสอบ: เปิด URL นี้ในเบราว์เซอร์ได้เลย
  // ──────────────────────────────────────────────────
  @Get('dashboard/:reportCode')
  @Redirect()
  @ApiOperation({ summary: 'เปิด Tableau Dashboard โดยตรง (Backend ขอ ticket เอง แล้ว Redirect)' })
  @ApiResponse({
    status: 302,
    description: 'Redirect ไปที่ Tableau Dashboard พร้อม Trusted Ticket',
  })
  async redirectToDashboard(@Param('reportCode') reportCode: string) {
    // ตรวจสอบว่า reportCode ถูกต้อง
    if (!TABLEAU_REPORT_CODES.includes(reportCode as any)) {
      throw new HttpException(
        `reportCode ไม่ถูกต้อง ต้องเป็นหนึ่งใน: ${TABLEAU_REPORT_CODES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Backend ขอ ticket เอง
    const result = await this.tableauService.getTrustedUrl({
      reportCode: reportCode as any,
    });

    // Redirect ไป Tableau โดยตรง
    return { url: result.url, statusCode: 302 };
  }
}
