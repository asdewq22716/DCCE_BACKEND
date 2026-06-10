import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TableauService } from './tableau.service';
import { TABLEAU_REPORT_CODES } from './dto/get-tableau-ticket.dto';

@ApiTags('Tableau')
@Controller('tableau')
export class TableauController {
  constructor(private readonly tableauService: TableauService) { }

  // GET /tableau/dashboard/:reportCode
  // Backend ขอ ticket เอง → คืน URL ที่ประกอบ token แล้วกลับไป
  @Get('dashboard/:reportCode')
  @ApiOperation({ summary: 'ขอ Tableau Dashboard URL พร้อม Trusted Token (Frontend เอาไปเปิดใน iframe)' })
  @ApiParam({
    name: 'reportCode',
    description: 'รหัส Dashboard ที่ต้องการเปิด',
    enum: TABLEAU_REPORT_CODES,
    example: 'REP01',
  })
  @ApiResponse({
    status: 200,
    description: 'URL พร้อม token สำหรับเปิด Tableau Dashboard',
    schema: {
      example: {
        success: true,
        url: 'http://192.168.65.58/trusted/bAFdbDBKQXuC_PWJBLm2uQ==:xxx/views/REP01_/sheet0',
      },
    },
  })
  async getDashboardUrl(@Param('reportCode') reportCode: string) {
    if (!TABLEAU_REPORT_CODES.includes(reportCode as any)) {
      throw new HttpException(
        `reportCode ไม่ถูกต้อง ต้องเป็นหนึ่งใน: ${TABLEAU_REPORT_CODES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.tableauService.getTrustedUrl({ reportCode: reportCode as any });
  }
}

