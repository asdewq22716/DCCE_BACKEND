import { Module } from '@nestjs/common';
import { ApiRequestsService } from './api-requests.service';
import { ApiRequestsController } from './api-requests.controller';
import { ServerIpsModule } from './server-ips/server-ips.module';
import { ApiObjectivesModule } from './api-objectives/api-objectives.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [ServerIpsModule, ApiObjectivesModule, ApprovalsModule],
  controllers: [ApiRequestsController],
  providers: [ApiRequestsService],
  exports: [ApiRequestsService],
})
export class ApiRequestsModule { }
