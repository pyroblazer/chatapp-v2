import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageService } from '../message.service';
import { Services } from '../../utils/constants';
import { Message } from '../../utils/typeorm';
import {
  createMockRepository,
  mockConversationsService,
  mockMessageAttachmentsService,
  mockFriendsService,
} from '../../__mocks__';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getRepositoryToken(Message),
          useValue: createMockRepository(),
        },
        { provide: Services.CONVERSATIONS, useValue: mockConversationsService },
        {
          provide: Services.MESSAGE_ATTACHMENTS,
          useValue: mockMessageAttachmentsService,
        },
        { provide: Services.FRIENDS_SERVICE, useValue: mockFriendsService },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
