import { Module } from '@nestjs/common';
import { ApiRequestsService } from './api-requests.service';
import { ApiRequestsController } from './api-requests.controller';

@Module({
  controllers: [ApiRequestsController],
  providers: [ApiRequestsService],
  exports: [ApiRequestsService],
})
export class ApiRequestsModule {}
