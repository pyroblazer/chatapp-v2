import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private producer: Producer;
  private consumer: Consumer;
  private connected = false;
  private readonly enabled: boolean;

  constructor() {
    this.enabled = !!process.env.KAFKA_BROKER_LIST;

    if (!this.enabled) return;

    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'chatapp-backend',
      brokers: (process.env.KAFKA_BROKER_LIST || '').split(','),
      ssl: process.env.KAFKA_SECURITY_PROTOCOL === 'ssl',
      logLevel: logLevel.WARN,
    });

    this.producer = kafka.producer();
    this.consumer = kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'chatapp-consumer-group',
    });
  }

  async onModuleInit() {
    if (!this.enabled) return;
    try {
      await this.producer.connect();
      this.connected = true;
      this.logger.log('Kafka producer connected');
    } catch (err) {
      this.logger.warn('Kafka unavailable — running without it');
    }
  }

  async publish(topic: string, message: any): Promise<void> {
    if (!this.connected) return;
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async consume(topic: string, callback: (message: any) => void): Promise<void> {
    if (!this.connected) return;
    await this.consumer.connect();
    await this.consumer.subscribe({ topic, fromBeginning: true });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          callback(JSON.parse(message.value.toString()));
        } catch (err) {
          this.logger.error(`Error processing message from ${topic}`, err);
        }
      },
    });
  }

  isAvailable(): boolean {
    return this.connected;
  }

  async onModuleDestroy() {
    if (!this.connected) return;
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
    } catch (err) {
      this.logger.error('Error disconnecting Kafka', err);
    }
  }
}
