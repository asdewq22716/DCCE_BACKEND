import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class PgPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgPoolService.name);
  public readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
      max: 20,
    });
  }

  async onModuleInit() {
    try {
      await this.pool.query('SELECT 1');
      this.logger.log('Successfully connected to PostgreSQL (PgPoolService)');
    } catch (error: any) {
      this.logger.error('Failed to connect to PostgreSQL (PgPoolService)', error.stack);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('PostgreSQL connection pool closed (PgPoolService)');
  }
}
