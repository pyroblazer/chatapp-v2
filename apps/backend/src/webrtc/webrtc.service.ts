import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebRTCService {
  constructor(private configService: ConfigService) {}

  getTurnCredentials() {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: this.configService.get('TURN_SERVER_URL') || 'turn:free.expressturn.com:3478',
          username: this.configService.get('TURN_USERNAME'),
          credential: this.configService.get('TURN_CREDENTIAL'),
        },
      ],
    };
  }
}
