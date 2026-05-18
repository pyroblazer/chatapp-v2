import { Controller, Get, Post, Body } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Services } from '../utils/constants';
import { RabbitMQService } from './rabbitmq.service';

@Controller('test/rabbitmq')
export class RabbitMQController {
  constructor(
    @Inject(Services.RABBITMQ_SERVICE) private rabbitmqService: RabbitMQService,
  ) {}

  @Get()
  async test() {
    try {
      const testQueue = 'test_queue';
      const testMessage = {
        message: 'Hello RabbitMQ',
        timestamp: new Date(),
        service: 'ChatApp',
      };

      const published = await this.rabbitmqService.publish(
        testQueue,
        testMessage,
      );

      return {
        success: true,
        message: published
          ? 'Message published to test_queue successfully'
          : 'Failed to publish message',
        isAvailable: this.rabbitmqService.isAvailable(),
        data: testMessage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isAvailable: this.rabbitmqService.isAvailable(),
      };
    }
  }

  @Post('publish')
  async publish(@Body() body: { queue: string; message: any }) {
    try {
      const published = await this.rabbitmqService.publish(
        body.queue,
        body.message,
      );

      return {
        success: true,
        message: published
          ? `Message published to ${body.queue} successfully`
          : 'Failed to publish message',
        isAvailable: this.rabbitmqService.isAvailable(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isAvailable: this.rabbitmqService.isAvailable(),
      };
    }
  }

  @Post('consume')
  async consume(@Body() body: { queue: string }) {
    try {
      await this.rabbitmqService.consume(body.queue, async (message) => {
        console.log(`Received message from ${body.queue}:`, message);
      });

      return {
        success: true,
        message: `Consumer registered for queue: ${body.queue}`,
        isAvailable: this.rabbitmqService.isAvailable(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isAvailable: this.rabbitmqService.isAvailable(),
      };
    }
  }

  @Get('status')
  async status() {
    return {
      isAvailable: this.rabbitmqService.isAvailable(),
      service: 'RabbitMQ',
      timestamp: new Date(),
    };
  }
}
