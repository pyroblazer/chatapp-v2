import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { KafkaService } from '../kafka/kafka.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

const KEEPALIVE_TABLE = '_keepalive_pings';
const KEEPALIVE_TOPIC = 'keepalive';

@Injectable()
export class DbKeepaliveService {
  private readonly logger = new Logger(DbKeepaliveService.name);
  private tableEnsured = false;

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @Optional() private readonly kafkaService?: KafkaService,
    @Optional() private readonly rabbitMQService?: RabbitMQService,
  ) {}

  /**
   * Ensure the lightweight keepalive table exists. Done once on first run
   * so we don't hammer the DDL parser every 5 minutes.
   */
  private async ensureTable(): Promise<void> {
    if (this.tableEnsured) return;

    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS "${KEEPALIVE_TABLE}" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pinged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);

    this.tableEnsured = true;
    this.logger.log(`Keepalive table "${KEEPALIVE_TABLE}" ready`);
  }

  /**
   * DB keepalive — INSERT a row then immediately DELETE it.
   * This exercises both write and delete paths so the database
   * sees real DML activity and won't auto-pause.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async keepalive() {
    try {
      await this.ensureTable();

      const [{ id }] = await this.connection.query(
        `INSERT INTO "${KEEPALIVE_TABLE}" (pinged_at) VALUES (now()) RETURNING id`,
      );

      await this.connection.query(
        `DELETE FROM "${KEEPALIVE_TABLE}" WHERE id = $1`,
        [id],
      );

      this.logger.debug('DB keepalive OK (insert + delete)');
    } catch (err) {
      this.logger.warn('DB keepalive failed', err?.message ?? err);
    }
  }

  /**
   * Kafka / RabbitMQ keepalive — publish a tiny heartbeat message
   * so the message broker registers traffic and stays alive.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async messageBrokerKeepalive() {
    const payload = {
      ts: new Date().toISOString(),
      source: 'chatapp-keepalive',
    };

    // Kafka
    if (this.kafkaService?.isAvailable()) {
      try {
        await this.kafkaService.publish(KEEPALIVE_TOPIC, payload);
        this.logger.debug('Kafka keepalive OK');
      } catch (err) {
        this.logger.warn('Kafka keepalive failed', err?.message ?? err);
      }
    }

    // RabbitMQ
    if (this.rabbitMQService?.isAvailable()) {
      try {
        await this.rabbitMQService.publish(KEEPALIVE_TOPIC, payload);
        this.logger.debug('RabbitMQ keepalive OK');
      } catch (err) {
        this.logger.warn('RabbitMQ keepalive failed', err?.message ?? err);
      }
    }
  }
}
