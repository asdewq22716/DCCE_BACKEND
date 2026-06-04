import { Module } from '@nestjs/common';
import { TitleBannerSettingsService } from './title-banner-settings.service';
import { TitleBannerSettingsController } from './title-banner-settings.controller';

@Module({
  controllers: [TitleBannerSettingsController],
  providers: [TitleBannerSettingsService],
  exports: [TitleBannerSettingsService]
})
export class TitleBannerSettingsModule {}
