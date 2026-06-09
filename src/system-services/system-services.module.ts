import { Module } from '@nestjs/common';
import { SystemServicesService } from './system-services.service';
import { SystemServicesController } from './system-services.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [SystemServicesController],
  providers: [SystemServicesService],
  exports: [SystemServicesService],
})
export class SystemServicesModule {}
