import { Controller, Get, Post, Body } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { Public } from '../utils/public.decorator';

@Controller('test/kafka')
export class KafkaController {
  constructor(private kafkaService: KafkaService) {}

  @Public()
  @Get()
  async test() {
    return {
      success: true,
      message: 'Kafka service is available',
      isAvailable: this.kafkaService.isAvailable(),
      timestamp: new Date(),
    };
  }

  @Public()
  @Post('publish')
  async publish(@Body() body: { topic: string; message: any }) {
    try {
      await this.kafkaService.publish(body.topic, body.message);
      return {
        success: true,
        message: `Message published to topic ${body.topic}`,
        isAvailable: this.kafkaService.isAvailable(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isAvailable: this.kafkaService.isAvailable(),
      };
    }
  }

  @Public()
  @Post('consume')
  async consume(@Body() body: { topic: string }) {
    try {
      await this.kafkaService.consume(body.topic, (message) => {
        console.log(`Received message from ${body.topic}:`, message);
      });
      return {
        success: true,
        message: `Consumer registered for topic: ${body.topic}`,
        isAvailable: this.kafkaService.isAvailable(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isAvailable: this.kafkaService.isAvailable(),
      };
    }
  }

  @Public()
  @Get('status')
  async status() {
    return {
      service: 'Kafka',
      isAvailable: this.kafkaService.isAvailable(),
      timestamp: new Date(),
    };
  }
}
