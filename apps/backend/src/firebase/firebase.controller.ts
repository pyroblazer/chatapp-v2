import { Controller, Post, Body, Get } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { Public } from '../utils/public.decorator';

@Controller('firebase')
export class FirebaseController {
  constructor(private firebaseService: FirebaseService) {}

  @Public()
  @Post('send-notification')
  async sendNotification(@Body() body: {
    token: string;
    title: string;
    message: string;
    data?: Record<string, string>;
  }) {
    try {
      await this.firebaseService.sendPushNotification(body.token, {
        notification: {
          title: body.title,
          body: body.message,
        },
        data: body.data,
      });
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Public()
  @Post('send-multicast')
  async sendMulticast(@Body() body: {
    tokens: string[];
    title: string;
    message: string;
    data?: Record<string, string>;
  }) {
    try {
      const result = await this.firebaseService.sendMulticastNotification(body.tokens, {
        notification: {
          title: body.title,
          body: body.message,
        },
        data: body.data,
      });
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Public()
  @Post('subscribe-topic')
  async subscribeToTopic(@Body() body: { tokens: string[]; topic: string }) {
    try {
      await this.firebaseService.subscribeToTopic(body.tokens, body.topic);
      return {
        success: true,
        message: `Subscribed ${body.tokens.length} tokens to topic: ${body.topic}`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Public()
  @Post('send-topic-notification')
  async sendTopicNotification(@Body() body: {
    topic: string;
    title: string;
    message: string;
    data?: Record<string, string>;
  }) {
    try {
      await this.firebaseService.sendTopicNotification(body.topic, {
        notification: {
          title: body.title,
          body: body.message,
        },
        data: body.data,
      });
      return { success: true, message: `Notification sent to topic: ${body.topic}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Public()
  @Get('status')
  async status() {
    return {
      service: 'Firebase',
      status: 'active',
      timestamp: new Date(),
    };
  }
}
