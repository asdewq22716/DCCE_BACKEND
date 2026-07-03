import { Controller, Get, Query, UseGuards, Param, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiSecurity } from '@nestjs/swagger';
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'ดึงข้อมูล fact_api_detail (Pagination & Filter)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'จำนวน row ที่ต้องการ (default: 100)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'ข้ามไปกี่ row (default: 0)' })
  @ApiQuery({ name: 'branch_id', required: false, type: Number, description: 'รหัสสาขาที่ต้องการกรอง (Optional)' })
  getFactApiDetail(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('branch_id') branchId?: number
  ) {
    return this.reportsService.getFactApiDetail(
      limit ? Number(limit) : 100,
      offset ? Number(offset) : 0,
      branchId ? Number(branchId) : undefined
    );
  }
}
