import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebRTCService } from './webrtc.service';

@Controller('webrtc')
@UseGuards(JwtAuthGuard)
export class WebRTCController {
  constructor(private readonly webrtcService: WebRTCService) {}

  @Get('turn-credentials')
  getTurnCredentials() {
    return this.webrtcService.getTurnCredentials();
  }
}
