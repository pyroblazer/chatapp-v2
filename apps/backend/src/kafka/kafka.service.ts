import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as Kafka from 'node-rdkafka';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private producer: Kafka.Producer;
  private consumer: Kafka.KafkaConsumer;
  private isConnected = false;

  constructor() {
    this.producer = new Kafka.Producer({
      'metadata.broker.list': process.env.KAFKA_BROKER_LIST || 'chatapp-react-next-kafka-chatapp-react-next.h.aivencloud.com:25204',
      'security.protocol': process.env.KAFKA_SECURITY_PROTOCOL || 'ssl',
      'ssl.key.location': process.env.KAFKA_SSL_KEY_LOCATION || 'service.key',
      'ssl.certificate.location': process.env.KAFKA_SSL_CERT_LOCATION || 'service.cert',
      'ssl.ca.location': process.env.KAFKA_SSL_CA_LOCATION || 'ca.pem',
      'client.id': process.env.KAFKA_CLIENT_ID || 'chatapp-backend',
      dr_cb: true,
    });

    this.consumer = new Kafka.KafkaConsumer({
      'metadata.broker.list': process.env.KAFKA_BROKER_LIST || 'chatapp-react-next-kafka-chatapp-react-next.h.aivencloud.com:25204',
      'group.id': process.env.KAFKA_GROUP_ID || 'chatapp-consumer-group',
      'security.protocol': process.env.KAFKA_SECURITY_PROTOCOL || 'ssl',
      'ssl.key.location': process.env.KAFKA_SSL_KEY_LOCATION || 'service.key',
      'ssl.certificate.location': process.env.KAFKA_SSL_CERT_LOCATION || 'service.cert',
      'ssl.ca.location': process.env.KAFKA_SSL_CA_LOCATION || 'ca.pem',
      'auto.offset.reset': 'beginning',
    });
  }

  async onModuleInit() {
    try {
      await this.connectProducer();
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer:', error.message);
    }
  }

  async connectProducer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.producer.connect({}, (err) => {
        if (err) {
          reject(err);
        } else {
          this.isConnected = true;
          resolve();
        }
      });
    });
  }

  async publish(topic: string, message: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Kafka producer is not connected'));
        return;
      }

      try {
        const messageBuffer = Buffer.from(JSON.stringify(message));

        this.producer.produce(
          topic,
          null,
          messageBuffer,
          null,
          Date.now(),
          (err) => {
            if (err) {
              this.logger.error(`Failed to send message to topic ${topic}:`, err.message);
              reject(err);
            } else {
              this.logger.debug(`Message sent to topic ${topic}`);
              resolve();
            }
          }
        );
      } catch (error) {
        this.logger.error(`Error producing message to ${topic}:`, error.message);
        reject(error);
      }
    });
  }

  async consume(topic: string, callback: (message: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.consumer.subscribe([topic]);
      this.consumer.consume();

      this.consumer.on('data', (data) => {
        try {
          const message = JSON.parse(data.value.toString());
          this.logger.debug(`Received message from topic ${topic}:`, message);
          callback(message);
        } catch (error) {
          this.logger.error(`Error processing message from ${topic}:`, error.message);
        }
      });

      this.consumer.on('event', (event) => {
        if (event.type === 'ready') {
          this.logger.log(`Kafka consumer ready for topic: ${topic}`);
          resolve();
        }
      });

      setTimeout(() => {
        if (!this.consumer.isConnected()) {
          reject(new Error('Kafka consumer failed to connect'));
        }
      }, 10000);
    });
  }

  isAvailable(): boolean {
    return this.isConnected && this.consumer.isConnected();
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Kafka...');

    try {
      if (this.producer) {
        this.producer.disconnect();
      }
      if (this.consumer) {
        this.consumer.disconnect();
      }
    } catch (error) {
      this.logger.error('Error disconnecting Kafka:', error.message);
    }
  }
}
