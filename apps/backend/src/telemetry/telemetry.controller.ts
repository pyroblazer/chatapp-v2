import { Controller, Get, Header } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';

@Controller('metrics')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(): string {
    return this.telemetryService.getMetrics();
  }
}
