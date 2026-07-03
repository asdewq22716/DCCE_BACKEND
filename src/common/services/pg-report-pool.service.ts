import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class PgReportPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgReportPoolService.name);
  public readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REPORT_DB_HOST');
    const port = this.configService.get<number>('REPORT_DB_PORT');
    const user = this.configService.get<string>('REPORT_DB_USER');
    const database = this.configService.get<string>('REPORT_DB_NAME');

    this.logger.log(
      `Initializing PG Report Pool with host: ${host}, port: ${port}, user: ${user}, database: ${database}`,
    );

    this.pool = new Pool({
      host,
      port,
      user,
      password: this.configService.get<string>('REPORT_DB_PASSWORD'),
      database,
      max: 10, // Adjust this as needed for reporting
    });
  }

  async onModuleInit() {
    try {
      await this.pool.query('SELECT 1');
      this.logger.log('Successfully connected to PostgreSQL Report DB (PgReportPoolService)');
    } catch (error: any) {
      this.logger.error(
        'Failed to connect to PostgreSQL Report DB (PgReportPoolService)',
        error.stack,
      );
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('PostgreSQL Report DB connection pool closed (PgReportPoolService)');
  }
}
