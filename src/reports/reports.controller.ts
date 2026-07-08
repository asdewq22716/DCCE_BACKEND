import { Controller, Get, UseGuards, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports (รายงาน)')
@Controller('reports')
export class ReportsController {

  constructor(private readonly reportsService: ReportsService) { }

  @Get('credentials/:requestId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'ดึงข้อมูล URL และ API Token ที่ได้จากการอนุมัติ' })
  getCredentials(@Param('requestId') requestId: string, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.reportsService.getCredentials(requestId, userId);
  }

  @Get('fact-api-detail')
  @ApiSecurity('api_key')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'ดึงข้อมูล fact_api_detail สำหรับระบบภายนอก (ใช้ API Token และบังคับกรองข้อมูลตามสาขาที่ได้รับอนุมัติ)' })
  getFactApiDetail(@Req() req: any) {
    // ดึง branch_id (org_id ฝั่งเว็บ) ที่ถูกแนบมาใน Token จาก ApiKeyGuard
    const orgBranchId = req.apiToken.branch_id;
    
    // ส่งไปให้ Service แปลงรหัสและดึงข้อมูล
    return this.reportsService.getFactApiDetail(orgBranchId);
  }
}
