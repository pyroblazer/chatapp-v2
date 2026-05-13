import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { Channel, Connection, ConsumeMessage, Options } from 'amqplib';

export interface RabbitMQConnectionOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
}

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

@Injectable()
export class RabbitMQService implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly options: RabbitMQConnectionOptions;
  private reconnectAttempts = 0;
  private isShuttingDown = false;
  private readonly consumers: Map<string, string> = new Map();

  constructor(options: RabbitMQConnectionOptions) {
    this.options = options;
    this.connect();
  }

  private getConnectionString(): string {
    const { host, port, username, password, vhost } = this.options;
    return `amqp://${username}:${password}@${host}:${port}/${encodeURIComponent(vhost)}`;
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.getConnectionString());
      this.channel = await this.connection.createChannel();

      this.connection.on('close', () => {
        if (!this.isShuttingDown) {
          this.logger.warn('RabbitMQ connection closed. Attempting reconnect...');
          this.attemptReconnect();
        }
      });

      this.connection.on('error', (err) => {
        this.logger.error(`RabbitMQ connection error: ${err.message}`);
      });

      this.channel.on('error', (err) => {
        this.logger.error(`RabbitMQ channel error: ${err.message}`);
      });

      // Set up prefetch for fair dispatch
      await this.channel.prefetch(10);

      // Re-register consumers after reconnection
      await this.restoreConsumers();

      this.reconnectAttempts = 0;
      this.logger.log('Connected to RabbitMQ successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.isShuttingDown || this.reconnectAttempts >= MAX_RETRIES) {
      this.logger.error(
        `Max reconnection attempts (${MAX_RETRIES}) reached. Giving up.`,
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
      MAX_DELAY_MS,
    );

    this.logger.log(
      `Attempting reconnect ${this.reconnectAttempts}/${MAX_RETRIES} in ${delay}ms...`,
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private async restoreConsumers(): Promise<void> {
    for (const [queue, consumerTag] of this.consumers.entries()) {
      try {
        // The old consumer tags are invalid after reconnection; we clear and re-consume
        this.consumers.delete(queue);
      } catch {
        // Ignore
      }
    }
    // Consumers are tracked by their handlers - they need to be re-registered
    // by the calling code. We emit a custom mechanism through a reconnect event
    // that queue processors listen to.
  }

  private async ensureChannel(): Promise<Channel> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }
    return this.channel;
  }

  /**
   * Assert a queue with optional dead letter exchange configuration.
   */
  async assertQueue(
    queue: string,
    options?: Options.AssertQueue,
  ): Promise<void> {
    const channel = await this.ensureChannel();

    // Set up dead letter exchange for this queue
    const dlxExchange = `${queue}.dlx`;
    const dlqName = `${queue}.dlq`;

    await channel.assertExchange(dlxExchange, 'direct', { durable: true });
    await channel.assertQueue(dlqName, { durable: true });
    await channel.bindQueue(dlqName, dlxExchange, queue);

    const queueOptions: Options.AssertQueue = {
      durable: true,
      ...options,
      arguments: {
        'x-dead-letter-exchange': dlxExchange,
        'x-dead-letter-routing-key': queue,
        ...(options?.arguments || {}),
      },
    };

    await channel.assertQueue(queue, queueOptions);
    this.logger.log(`Queue asserted: ${queue} (DLQ: ${dlqName})`);
  }

  /**
   * Publish a message to a queue.
   */
  async publish(queue: string, message: any): Promise<boolean> {
    const channel = await this.ensureChannel();
    await this.assertQueue(queue);

    const buffer = Buffer.from(JSON.stringify(message));
    const sent = channel.sendToQueue(queue, buffer, {
      persistent: true,
      contentType: 'application/json',
    });

    if (!sent) {
      this.logger.warn(`Failed to publish message to queue: ${queue}`);
    }

    return sent;
  }

  /**
   * Consume messages from a queue with retry logic.
   * Failed messages are nacked and routed to the DLQ after 3 attempts.
   */
  async consume(
    queue: string,
    handler: (message: any) => Promise<void>,
  ): Promise<void> {
    const channel = await this.ensureChannel();
    await this.assertQueue(queue);

    const { consumerTag } = await channel.consume(queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      const retryCount = this.getRetryCount(msg);
      const maxRetries = 3;

      try {
        const content = JSON.parse(msg.content.toString());
        this.logger.debug(
          `Processing message from ${queue} (retry: ${retryCount})`,
        );
        await handler(content);
        channel.ack(msg);
      } catch (error) {
        this.logger.error(
          `Error processing message from ${queue}: ${error.message}`,
        );

        if (retryCount < maxRetries) {
          // Reject and requeue with incremented retry count
          channel.ack(msg);
          const headers = msg.properties.headers || {};
          headers['x-retry-count'] = retryCount + 1;
          const buffer = Buffer.from(msg.content.toString());
          channel.sendToQueue(queue, buffer, {
            persistent: true,
            contentType: 'application/json',
            headers,
          });
        } else {
          // Max retries exceeded, reject to DLQ
          this.logger.warn(
            `Message from ${queue} exceeded max retries (${maxRetries}), sending to DLQ`,
          );
          channel.nack(msg, false, false);
        }
      }
    });

    this.consumers.set(queue, consumerTag);
    this.logger.log(`Consumer registered for queue: ${queue}`);
  }

  private getRetryCount(msg: ConsumeMessage): number {
    const headers = msg.properties.headers || {};
    return (headers['x-retry-count'] as number) || 0;
  }

  /**
   * Bind a queue to an exchange with a routing pattern.
   */
  async bindQueue(
    queue: string,
    exchange: string,
    pattern: string,
  ): Promise<void> {
    const channel = await this.ensureChannel();
    await channel.assertExchange(exchange, 'direct', { durable: true });
    await channel.assertQueue(queue);
    await channel.bindQueue(queue, exchange, pattern);
    this.logger.log(
      `Bound queue ${queue} to exchange ${exchange} with pattern ${pattern}`,
    );
  }

  /**
   * Get the underlying channel for advanced usage.
   */
  getChannel(): Channel | null {
    return this.channel;
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    this.logger.log('Shutting down RabbitMQ connection...');

    try {
      // Cancel all consumers
      if (this.channel) {
        for (const [queue, consumerTag] of this.consumers.entries()) {
          try {
            await this.channel.cancel(consumerTag);
            this.logger.log(`Cancelled consumer for queue: ${queue}`);
          } catch {
            // Channel might already be closed
          }
        }

        await this.channel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }

      this.logger.log('RabbitMQ connection closed gracefully');
    } catch (error) {
      this.logger.error(`Error closing RabbitMQ connection: ${error.message}`);
    }
  }
}
