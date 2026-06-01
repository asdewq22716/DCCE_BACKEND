import { Module } from '@nestjs/common';
import { NewsSettingsController } from './news-settings.controller';
import { NewsSettingsService } from './news-settings.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [NewsSettingsController],
  providers: [NewsSettingsService]
})
export class NewsSettingsModule {}
