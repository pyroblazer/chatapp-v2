import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Services } from '../../utils/constants';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';

export interface NotificationJob {
  userId: number;
  event: string;
  payload: any;
}

export const NOTIFICATIONS_QUEUE = 'notifications';

@Injectable()
export class NotificationProcessor implements OnModuleInit {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @Inject(Services.RABBITMQ_SERVICE)
    private readonly rabbitMQService: RabbitMQService,
    @Inject(Services.GATEWAY_SESSION_MANAGER)
    private readonly sessionManager: any,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.rabbitMQService.consume(
        NOTIFICATIONS_QUEUE,
        this.process.bind(this),
      );
      this.logger.log('Notification processor started');
    } catch {
      this.logger.warn(
        'Notification processor could not start — RabbitMQ unavailable',
      );
    }
  }

  async process(job: NotificationJob): Promise<void> {
    this.logger.log(
      `Dispatching notification to user ${job.userId}: ${job.event}`,
    );

    const socket = this.sessionManager.getUserSocket(job.userId);
    if (socket) {
      socket.emit(job.event, job.payload);
      this.logger.debug(
        `Notification delivered to user ${job.userId} via WebSocket`,
      );
    } else {
      this.logger.debug(
        `User ${job.userId} is offline, notification not delivered in real-time`,
      );
    }
  }
}
