import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseApiService } from '../common/services/base-api.service';
import { HttpService } from '@nestjs/axios';
import { GetTableauTicketDto } from './dto/get-tableau-ticket.dto';

@Injectable()
export class TableauService extends BaseApiService {
  constructor(
    httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super(httpService);
    // You can override default config if needed here by overriding getDefaultConfig()
  }

  async getTrustedUrl(dto: GetTableauTicketDto): Promise<{ success: boolean; url: string }> {
    const { dashboardPath } = dto;
    const tableauServerUrl = this.configService.get<string>('TABLEAU_SERVER_URL', 'http://192.168.65.59');

    // We are using hardcoded user for now as requested
    const username = 'admin_dcce';

    try {
      // From the provided python script, it sends username in the query string
      // and empty body for POST request
      console.log(tableauServerUrl);
      console.log(`${tableauServerUrl}/trusted?username=${username}`);
      const https = require('https');
      const ticket = await this.post<string>({
        url: `${tableauServerUrl}/trusted?username=${username}`,
        data: {}, // Empty payload as per python script
        config: {
          headers: {}, // Empty headers as per python script
          responseType: 'text',
          httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Like verify=False in Python
        },
      });

      // -1 means error in generating ticket
      if (!ticket || ticket.trim() === '-1') {
        this.logger.error('Failed to get Tableau trusted ticket (returned -1)');
        throw new HttpException('Authentication with Tableau failed (returned -1)', HttpStatus.UNAUTHORIZED);
      }

      // Compose the final URL
      const finalUrl = `${tableauServerUrl}/trusted/${ticket.trim()}${dashboardPath}`;

      return {
        success: true,
        url: finalUrl,
      };

    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Tableau API Error: ${err.message}`, err.stack);

      // If it's already an HttpException from our BaseApiService, throw it
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        'Failed to connect to Tableau Server',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
