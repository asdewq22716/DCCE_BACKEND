import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogService } from '../services/audit-log.service';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('modules')
  @ApiOperation({ summary: 'ดึงรายชื่อ Module ทั้งหมดที่มีการเก็บ Log (สำหรับทำ Dropdown)' })
  getAvailableModules() {
    return this.auditLogService.getAvailableModules();
  }

  @Get(':moduleName/:recordId')
  @ApiOperation({ summary: 'ดูประวัติการแก้ไขข้อมูล (Audit Logs) ตามชื่อ Module และ ID' })
  @ApiParam({ name: 'moduleName', example: 'banners', description: 'ชื่อโมดูล (เช่น banners, user_organizations)' })
  @ApiParam({ name: 'recordId', example: '5', description: 'รหัสอ้างอิงของข้อมูล' })
  getLogs(@Param('moduleName') moduleName: string, @Param('recordId') recordId: string) {
    return this.auditLogService.getLogs(moduleName, recordId);
  }
}
