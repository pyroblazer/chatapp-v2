import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Services } from '../../utils/constants';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';

export interface AuditEvent {
  action: string;
  userId?: number;
  resource?: string;
  resourceId?: string;
  details?: any;
  timestamp: string;
  ipAddress?: string;
}

export const AUDIT_EVENTS_QUEUE = 'audit-events';

@Injectable()
export class AuditProcessor implements OnModuleInit {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(
    @Inject(Services.RABBITMQ_SERVICE)
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitMQService.consume(
      AUDIT_EVENTS_QUEUE,
      this.process.bind(this),
    );
    this.logger.log('Audit processor started');
  }

  async process(event: AuditEvent): Promise<void> {
    this.logger.log(
      `Audit event: ${event.action} by user ${event.userId || 'system'} on ${
        event.resource || 'N/A'
      }`,
    );

    // For now, log the audit event. In Phase 8, this will persist to a
    // dedicated audit_logs table and potentially forward to external systems.
    this.logger.debug(`Audit details: ${JSON.stringify(event.details || {})}`);
  }
}
