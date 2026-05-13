import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryInterceptor } from './telemetry.interceptor';

@Module({
  imports: [ConfigModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryInterceptor],
  exports: [TelemetryService, TelemetryInterceptor],
})
export class TelemetryModule {}
