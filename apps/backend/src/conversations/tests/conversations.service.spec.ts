import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationsService } from '../conversations.service';
import { Services } from '../../utils/constants';
import { Conversation, Message } from '../../utils/typeorm';
import {
  createMockRepository,
  mockUserService,
  mockFriendsService,
} from '../../__mocks__';

describe('ConversationsService', () => {
  let service: ConversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Message),
          useValue: createMockRepository(),
        },
        { provide: Services.USERS, useValue: mockUserService },
        { provide: Services.FRIENDS_SERVICE, useValue: mockFriendsService },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
