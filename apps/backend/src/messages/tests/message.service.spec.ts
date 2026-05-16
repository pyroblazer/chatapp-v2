import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageService } from '../message.service';
import { Services } from '../../utils/constants';
import { Message } from '../../utils/typeorm';
import {
  mockUser,
  createMockRepository,
  mockConversationsService,
  mockMessageAttachmentsService,
  mockFriendsService,
} from '../../__mocks__';
import { ConversationNotFoundException } from '../../conversations/exceptions/ConversationNotFound';

describe('MessageService', () => {
  let service: MessageService;
  let messageRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    messageRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: getRepositoryToken(Message), useValue: messageRepo },
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    it('should throw ConversationNotFoundException if conversation not found', async () => {
      mockConversationsService.findById.mockResolvedValue(null);

      await expect(
        service.createMessage({
          user: mockUser as any,
          content: 'Hello',
          id: 999,
        } as any),
      ).rejects.toThrow(ConversationNotFoundException);
    });

    it('should create a message in a valid conversation', async () => {
      const conversation = {
        id: 1,
        creator: { id: '1' },
        recipient: { id: '2' },
      };
      mockConversationsService.findById.mockResolvedValue(conversation);
      mockFriendsService.isFriends.mockResolvedValue(true);
      messageRepo.create.mockReturnValue({ content: 'Hello', conversation });
      messageRepo.save.mockResolvedValue({ id: 'msg-1', content: 'Hello' });
      mockConversationsService.save.mockResolvedValue(conversation);

      const result = await service.createMessage({
        user: { ...mockUser, id: '1' } as any,
        content: 'Hello',
        id: 1,
      } as any);

      expect(result.message).toBeDefined();
      expect(messageRepo.save).toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return messages for a conversation', async () => {
      const mockMessages = [
        { id: '1', content: 'Hello' },
        { id: '2', content: 'World' },
      ];
      messageRepo.find.mockResolvedValue(mockMessages);

      const result = await service.getMessages(1);

      expect(result).toEqual(mockMessages);
      expect(messageRepo.find).toHaveBeenCalledWith({
        relations: ['author', 'attachments', 'author.profile'],
        where: { conversation: { id: 1 } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('editMessage', () => {
    it('should edit a message when found', async () => {
      const messageDB = {
        id: 'msg-1',
        content: 'old content',
        author: { id: 'user-1' },
      };
      messageRepo.findOne.mockResolvedValue(messageDB);
      messageRepo.save.mockResolvedValue({
        ...messageDB,
        content: 'new content',
      });

      const result = await service.editMessage({
        messageId: 'msg-1',
        userId: 'user-1',
        conversationId: 'conv-1',
        content: 'new content',
      });

      expect(result.content).toBe('new content');
      expect(messageRepo.save).toHaveBeenCalled();
    });

    it('should throw if message not found for edit', async () => {
      messageRepo.findOne.mockResolvedValue(null);

      await expect(
        service.editMessage({
          messageId: 'nonexistent',
          userId: 'user-1',
          conversationId: 'conv-1',
          content: 'new content',
        }),
      ).rejects.toThrow('Cannot edit message: insufficient permissions');
    });
  });
});
