import { Module } from '@nestjs/common';
import { AboutUsController } from './about-us.controller';
import { AboutUsService } from './about-us.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [AboutUsController],
  providers: [AboutUsService]
})
export class AboutUsModule {}
