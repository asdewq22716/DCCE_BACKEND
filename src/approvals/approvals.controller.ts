import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { ActionApprovalDto } from './dto/approval.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Approvals (Global)')
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดึงรายการคำขอที่รออนุมัติทั้งหมด (Inbox)' })
  async getPendingApprovals() {
    return await this.approvalsService.getPendingApprovals();
  }

  @Patch(':id/action')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดำเนินการ อนุมัติ / ไม่อนุมัติ' })
  async actionApproval(
    @Param('id') id: number,
    @Body() dto: ActionApprovalDto,
    @Req() req: any
  ) {
    const userId = req.user?.userId?.toString() || 'unknown';
    return await this.approvalsService.actionApproval(id, dto, userId);
  }
}
