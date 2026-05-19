import { Injectable } from '@nestjs/common';
import { StreamClient } from '@stream-io/video-react-sdk';

@Injectable()
export class StreamService {
  private client: StreamClient;

  constructor() {
    this.client = new StreamClient({
      apiKey: process.env.STREAM_API_KEY,
      secret: process.env.STREAM_API_SECRET,
    });
  }

  async createVideoToken(userId: string) {
    return this.client.createToken(userId);
  }
}
