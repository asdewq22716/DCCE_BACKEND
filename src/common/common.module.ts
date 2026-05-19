import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BaseApiService } from './services/base-api.service';
import { FncDB } from './services/fnc-db.service';
import { PgPoolService } from './services/pg-pool.service';
import { AuditLogService } from './services/audit-log.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [BaseApiService, FncDB, PgPoolService, AuditLogService],
  exports: [BaseApiService, FncDB, PgPoolService, AuditLogService, HttpModule],
})
export class CommonModule {}
