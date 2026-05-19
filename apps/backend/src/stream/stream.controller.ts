import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StreamService } from './stream.service';

@Controller('stream')
@UseGuards(JwtAuthGuard)
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('video-token')
  async getVideoToken(@Req() req) {
    const userId = req.user.id;
    const token = await this.streamService.createVideoToken(userId);
    return {
      token,
      userId,
      apiKey: process.env.STREAM_API_KEY,
    };
  }
}
