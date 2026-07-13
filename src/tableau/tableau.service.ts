import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseApiService } from '../common/services/base-api.service';
import { HttpService } from '@nestjs/axios';
import * as https from 'https';
import { GetTableauTicketDto, TABLEAU_REPORTS, TABLEAU_REPORT_CODES, TableauReportCode } from './dto/get-tableau-ticket.dto';

@Injectable()
export class TableauService extends BaseApiService {
  constructor(
    httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super(httpService);
  }


  async getTrustedUrl(dto: GetTableauTicketDto): Promise<{ success: boolean; name: string; url: string }> {
    const { reportCode, username: dtoUsername } = dto;

    const tableauServerUrl = this.configService.get<string>('TABLEAU_SERVER_URL');
    const tableauServerView = this.configService.get<string>('TABLEAU_SERVER_VIEW') || tableauServerUrl;
    // ใช้ username จาก DTO ถ้ามี ไม่งั้นดึงจาก env
    const username = dtoUsername || this.configService.get<string>('TABLEAU_USERNAME');

    if (!tableauServerUrl) throw new Error('TABLEAU_SERVER_URL ไม่ได้กำหนดใน env');
    if (!username) throw new Error('TABLEAU_USERNAME ไม่ได้กำหนดใน env');

    // แปลง reportCode → dashboard path จริง
    const dashboardPath = TABLEAU_REPORTS[reportCode].path;

    const trustedUrl = `${tableauServerUrl}/trusted`;
    this.logger.log(`Requesting Tableau trusted ticket: POST ${trustedUrl}?username=${username} (report: ${reportCode})`);

    try {
      // ส่ง username ใน body แบบ form-encoded
      // ตรงกับ: curl -X POST -d "username=dcceadmin" http://192.168.65.58/trusted
      const ticket = await this.post<string>({
        url: trustedUrl,
        data: new URLSearchParams({ username }),
        config: { httpsAgent: new https.Agent({ rejectUnauthorized: false }) },
      });

      this.logger.log(`Tableau ticket received: ${ticket}`);

      if (!ticket || ticket.trim() === '-1') {
        this.logger.error('Tableau returned -1: IP not in Trusted Hosts or invalid username');
        throw new HttpException(
          'Authentication with Tableau failed (returned -1)',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const finalUrl = `${tableauServerView}/trusted/${ticket.trim()}${dashboardPath}`;
      this.logger.log(`Final Tableau URL: ${finalUrl}`);

      return { success: true, name: TABLEAU_REPORTS[reportCode].name, url: finalUrl };

    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Tableau API Error: ${err.message}`, err.stack);

      if (err instanceof HttpException) throw err;

      throw new HttpException('Failed to connect to Tableau Server', HttpStatus.BAD_GATEWAY);
    }
  }
  // GET /tableau/dashboards — ดึง URL ทุก dashboard พร้อมกันในครั้งเดียว
  async getAllDashboardUrls(): Promise<Record<TableauReportCode, { url: string; path: string }>> {
    const results = await Promise.allSettled(
      TABLEAU_REPORT_CODES.map(async (code) => {
        const result = await this.getTrustedUrl({ reportCode: code });
        return { code, name: TABLEAU_REPORTS[code].name, url: result.url, path: TABLEAU_REPORTS[code].path };
      })
    );

    const dashboards: Partial<Record<TableauReportCode, { name: string; url: string; path: string }>> = {};
    for (const result of results) {
      if (result.status === 'fulfilled') {
        dashboards[result.value.code] = {
          name: result.value.name,
          url: result.value.url,
          path: result.value.path,
        };
      }
    }

    return dashboards as Record<TableauReportCode, { name: string; url: string; path: string }>;
  }
}
