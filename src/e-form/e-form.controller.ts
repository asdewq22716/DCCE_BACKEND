import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { EFormService } from './e-form.service';

@ApiTags('E-Form Proxy')
@Controller('e-form')
export class EFormController {
  constructor(private readonly eFormService: EFormService) {}

  @Post('login')
  @ApiOperation({ summary: 'Proxy for E-Form Login (Optional)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'admin' },
        password: { type: 'string', example: 'admin1234' },
        loginType: { type: 'string', example: 'api' },
      },
    },
  })
  async testLogin(@Body() body: any) {
    return this.eFormService.testLogin(body);
  }

  @Get('answers')
  @ApiOperation({ summary: 'Auto-login and fetch E-Form Answers' })
  async getAnswers() {
    return this.eFormService.getAnswers();
  }
}
