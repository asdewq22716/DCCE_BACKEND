import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseApiService } from '../common/services/base-api.service';
import { HttpService } from '@nestjs/axios';
import * as https from 'https';
import { GetTableauTicketDto, TABLEAU_DASHBOARD_PATHS } from './dto/get-tableau-ticket.dto';

@Injectable()
export class TableauService extends BaseApiService {
  constructor(
    httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super(httpService);
  }

  async getTrustedUrl(dto: GetTableauTicketDto): Promise<{ success: boolean; url: string }> {
    const { reportCode, username: dtoUsername } = dto;

    const tableauServerUrl = this.configService.get<string>('TABLEAU_SERVER_URL');
    // ใช้ username จาก DTO ถ้ามี ไม่งั้นดึงจาก env
    const username = dtoUsername || this.configService.get<string>('TABLEAU_USERNAME');

    if (!tableauServerUrl) throw new Error('TABLEAU_SERVER_URL ไม่ได้กำหนดใน env');
    if (!username) throw new Error('TABLEAU_USERNAME ไม่ได้กำหนดใน env');

    // แปลง reportCode → dashboard path จริง
    const dashboardPath = TABLEAU_DASHBOARD_PATHS[reportCode];

    const trustedUrl = `${tableauServerUrl}/trusted?username=${username}`;
    this.logger.log(`Requesting Tableau trusted ticket: POST ${trustedUrl} (report: ${reportCode})`);

    try {
      // ต้องส่ง Content-Type: application/x-www-form-urlencoded + body ว่าง
      // curl: -H "Content-Type: application/x-www-form-urlencoded" -d ""
      // ถ้าส่ง data:{} → Axios serialize เป็น JSON → Tableau return -1
      const ticket = await this.post<string>({
        url: trustedUrl,
        data: '',
        config: {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          responseType: 'text',
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        },
      });

      this.logger.log(`Tableau ticket received: ${ticket}`);

      if (!ticket || ticket.trim() === '-1') {
        this.logger.error('Tableau returned -1: IP not in Trusted Hosts or invalid username');
        throw new HttpException(
          'Authentication with Tableau failed (returned -1)',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const finalUrl = `${tableauServerUrl}/trusted/${ticket.trim()}${dashboardPath}`;
      this.logger.log(`Final Tableau URL: ${finalUrl}`);

      return { success: true, url: finalUrl };

    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Tableau API Error: ${err.message}`, err.stack);

      if (err instanceof HttpException) throw err;

      throw new HttpException('Failed to connect to Tableau Server', HttpStatus.BAD_GATEWAY);
    }
  }
}
