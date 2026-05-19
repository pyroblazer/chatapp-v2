import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebRTCController } from './webrtc.controller';
import { WebRTCService } from './webrtc.service';

@Module({
  imports: [ConfigModule],
  controllers: [WebRTCController],
  providers: [WebRTCService],
  exports: [WebRTCService],
})
export class WebRTCModule {}
