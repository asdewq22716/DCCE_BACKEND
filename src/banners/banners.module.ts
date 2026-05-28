import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';

@Module({
  imports: [UploadsModule],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
