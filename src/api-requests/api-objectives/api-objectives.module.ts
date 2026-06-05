import { Module } from '@nestjs/common';
import { ApiObjectivesService } from './api-objectives.service';
import { ApiObjectivesController } from './api-objectives.controller';

@Module({
  controllers: [ApiObjectivesController],
  providers: [ApiObjectivesService],
  exports: [ApiObjectivesService],
})
export class ApiObjectivesModule {}
