import { Injectable } from '@nestjs/common';
import { StreamClient } from '@stream-io/node-sdk';

@Injectable()
export class StreamService {
  private client: StreamClient;

  constructor() {
    const apiKey = process.env.STREAM_API_KEY || '';
    const secret = process.env.STREAM_API_SECRET || '';

    this.client = new StreamClient(apiKey, secret);
  }

  async createVideoToken(userId: string) {
    const exp = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now (unlimited call duration)
    const token = this.client.createToken(userId, {
      exp,
    });

    return token;
  }
}
