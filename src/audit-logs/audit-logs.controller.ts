import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการประวัติกิจกรรมทั้งหมด (พร้อมฟิลเตอร์และการแบ่งหน้า)' })
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียดของประวัติกิจกรรมตาม Log ID' })
  @ApiParam({ name: 'id', description: 'รหัส ID ของ Log', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditLogsService.findOne(id);
  }
}
