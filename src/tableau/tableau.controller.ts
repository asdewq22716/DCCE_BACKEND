import { Controller, Get, Param, Redirect, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TableauService } from './tableau.service';
import { TABLEAU_REPORT_CODES } from './dto/get-tableau-ticket.dto';

@ApiTags('Tableau')
@Controller('tableau')
export class TableauController {
  constructor(private readonly tableauService: TableauService) { }

  // GET /tableau/dashboard/:reportCode
  // Backend ขอ ticket เอง → Redirect ไป Tableau ทันที
  @Get('dashboard/:reportCode')
  @Redirect()
  @ApiOperation({ summary: 'เปิด Tableau Dashboard (Backend ขอ ticket เอง แล้ว Redirect)' })
  @ApiParam({
    name: 'reportCode',
    description: 'รหัส Dashboard ที่ต้องการเปิด',
    enum: TABLEAU_REPORT_CODES,   // ← แสดงเป็น Dropdown ใน Swagger
    example: 'REP01',
  })
  @ApiResponse({ status: 302, description: 'Redirect ไปที่ Tableau Dashboard พร้อม Trusted Ticket' })
  async redirectToDashboard(@Param('reportCode') reportCode: string) {
    if (!TABLEAU_REPORT_CODES.includes(reportCode as any)) {
      throw new HttpException(
        `reportCode ไม่ถูกต้อง ต้องเป็นหนึ่งใน: ${TABLEAU_REPORT_CODES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.tableauService.getTrustedUrl({ reportCode: reportCode as any });

    return { url: result.url, statusCode: 302 };
  }
}
