import { Module } from '@nestjs/common';
import { EFormService } from './e-form.service';
import { EFormController } from './e-form.controller';

@Module({
  controllers: [EFormController],
  providers: [EFormService],
})
export class EFormModule {}
