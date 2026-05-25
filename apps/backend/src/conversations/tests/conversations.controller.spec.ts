import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationsController } from '../conversations.controller';
import { Services } from '../../utils/constants';
import { mockConversationsService, mockUserService } from '../../__mocks__';
import { RedisCacheService } from '../../redis/redis.cache.service';

describe('ConversationsController', () => {
  let controller: ConversationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        {
          provide: Services.CONVERSATIONS,
          useValue: mockConversationsService,
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        {
          provide: Services.USERS,
          useValue: mockUserService,
        },
        { provide: RedisCacheService, useValue: { invalidatePattern: jest.fn(), invalidateCache: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ConversationsController>(ConversationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
