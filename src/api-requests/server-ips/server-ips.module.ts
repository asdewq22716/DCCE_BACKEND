import { Module } from '@nestjs/common';
import { ServerIpsService } from './server-ips.service';
import { ServerIpsController } from './server-ips.controller';

@Module({
  controllers: [ServerIpsController],
  providers: [ServerIpsService],
  exports: [ServerIpsService],
})
export class ServerIpsModule {}
