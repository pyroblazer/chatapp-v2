import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../utils/public.decorator';
import { TelemetryService } from './telemetry.service';

@ApiTags('Health')
@Controller('metrics')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Prometheus format metrics' })
  getMetrics(): string {
    return this.telemetryService.getMetrics();
  }
}
