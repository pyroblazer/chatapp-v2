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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async keepalive() {
    try {
      await this.connection.query('SELECT 1');
      this.logger.debug('DB keepalive OK');
    } catch (err) {
      this.logger.warn('DB keepalive failed', err.message);
    }
  }
}
