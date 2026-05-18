import { DynamicModule, Global, Module } from '@nestjs/common';
import { Services } from '../utils/constants';
import { RabbitMQService } from './rabbitmq.service';
import { RabbitMQController } from './rabbitmq.controller';

export interface RabbitMQModuleOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  vhost?: string;
}

@Global()
@Module({})
export class RabbitMQModule {
  static forRoot(options?: RabbitMQModuleOptions): DynamicModule {
    const host = options?.host || process.env.RABBITMQ_HOST || 'localhost';
    const port =
      options?.port || parseInt(process.env.RABBITMQ_PORT || '5672', 10);
    const username = options?.username || process.env.RABBITMQ_USER || 'guest';
    const password =
      options?.password || process.env.RABBITMQ_PASSWORD || 'guest';
    const vhost = options?.vhost || process.env.RABBITMQ_VHOST || '/';

    return {
      module: RabbitMQModule,
      controllers: [RabbitMQController],
      providers: [
        {
          provide: Services.RABBITMQ_SERVICE,
          useFactory: () => {
            const service = new RabbitMQService({
              host,
              port,
              username,
              password,
              vhost,
            });
            return service;
          },
        },
      ],
      exports: [Services.RABBITMQ_SERVICE],
    };
  }
}
