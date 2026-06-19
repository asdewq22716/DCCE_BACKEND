import { Module } from '@nestjs/common';
import { TitleBannerSettingsService } from './title-banner-settings.service';
import { TitleBannerSettingsController } from './title-banner-settings.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [TitleBannerSettingsController],
  providers: [TitleBannerSettingsService],
  exports: [TitleBannerSettingsService]
})
export class TitleBannerSettingsModule {}
