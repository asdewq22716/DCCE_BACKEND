import { Module } from '@nestjs/common';
import { ManualController } from './manual.controller';
import { ManualService } from './manual.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [ManualController],
  providers: [ManualService]
})
export class ManualModule {}
