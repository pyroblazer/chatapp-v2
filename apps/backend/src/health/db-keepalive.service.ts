import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class DbKeepaliveService {
  private readonly logger = new Logger(DbKeepaliveService.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  // Runs every 12 hours to prevent Aiven free-tier DB from being purged due to inactivity.
  @Cron(CronExpression.EVERY_12_HOURS)
  async keepalive() {
    try {
      await this.connection.query('SELECT 1');
      this.logger.log('DB keepalive ping OK');
    } catch (err) {
      this.logger.error('DB keepalive ping failed', err);
    }
  }
}
