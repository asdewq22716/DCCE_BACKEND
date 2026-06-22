import { Controller, Post, Body, Get } from '@nestjs/common';
import { EFormService } from './e-form.service';

@Controller('e-form')
export class EFormController {
  constructor(private readonly eFormService: EFormService) {}

  @Post('login')
  async testLogin(@Body() body: any) {
    return this.eFormService.testLogin(body);
  }

  @Get('answers')
  async getAnswers() {
    return this.eFormService.getAnswers();
  }
}
