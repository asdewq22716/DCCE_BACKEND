import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BaseApiService } from './services/base-api.service';
import { FncDB } from './services/fnc-db.service';
import { FncReportDB } from './services/fnc-report-db.service';
import { PgPoolService } from './services/pg-pool.service';
import { PgReportPoolService } from './services/pg-report-pool.service';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogsController } from './controllers/audit-logs.controller';

@Global()
@Module({
  imports: [HttpModule],
  controllers: [AuditLogsController],
  providers: [BaseApiService, FncDB, FncReportDB, PgPoolService, PgReportPoolService, AuditLogService],
  exports: [BaseApiService, FncDB, FncReportDB, PgPoolService, PgReportPoolService, AuditLogService, HttpModule],
})
export class CommonModule {}
