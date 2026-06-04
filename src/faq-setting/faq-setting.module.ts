import { Module } from '@nestjs/common';
import { FaqSettingController } from './faq-setting.controller';
import { FaqSettingService } from './faq-setting.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [FaqSettingController],
  providers: [FaqSettingService]
})
export class FaqSettingModule {}
