import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TelemetryService } from './telemetry.service';

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  constructor(private readonly telemetryService: TelemetryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const method = request.method || 'UNKNOWN';
    const route = request.route?.path || request.url || 'UNKNOWN';

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - start) / 1000;
          const statusCode = response.statusCode || 200;

          this.telemetryService.incrementCounter('http_requests_total', {
            method,
            route,
            status_code: String(statusCode),
          });

          this.telemetryService.observeHistogram(
            'http_request_duration_seconds',
            duration,
            {
              method,
              route,
              status_code: String(statusCode),
            },
          );
        },
        error: (err) => {
          const duration = (Date.now() - start) / 1000;
          const statusCode = err?.status || 500;

          this.telemetryService.incrementCounter('http_requests_total', {
            method,
            route,
            status_code: String(statusCode),
          });

          this.telemetryService.observeHistogram(
            'http_request_duration_seconds',
            duration,
            {
              method,
              route,
              status_code: String(statusCode),
            },
          );
        },
      }),
    );
  }
}
