import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { FncDB } from './common/services/fnc-db.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly db: FncDB,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Check API and Database Health' })
  async checkHealth() {
    try {
      const result = await this.db.query('SELECT NOW() as server_time');
      return {
        status: 'OK',
        database: 'Connected',
        server_time: result[0].server_time,
      };
    } catch (error: any) {
      return {
        status: 'Error',
        database: 'Disconnected',
        message: error.message,
      };
    }
  }
}
