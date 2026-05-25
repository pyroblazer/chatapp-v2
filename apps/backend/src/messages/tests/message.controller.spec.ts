import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageController } from '../message.controller';
import { Services } from '../../utils/constants';
import { mockMessagesService } from '../../__mocks__';
import { RedisCacheService } from '../../redis/redis.cache.service';

describe('MessageController', () => {
  let controller: MessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        { provide: Services.MESSAGES, useValue: mockMessagesService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: RedisCacheService, useValue: { invalidatePattern: jest.fn(), invalidateCache: jest.fn() } },
      ],
    }).compile();

    controller = module.get<MessageController>(MessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
