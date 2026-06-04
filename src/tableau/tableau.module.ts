import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TableauController } from './tableau.controller';
import { TableauService } from './tableau.service';

@Module({
  imports: [HttpModule],
  controllers: [TableauController],
  providers: [TableauService],
  exports: [TableauService],
})
export class TableauModule {}
