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
    const createMockQb = () => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    });

    it('should return messages using cursor-based pagination (first page)', async () => {
      const qb = createMockQb();
      const mockMessages = Array.from({ length: 51 }, (_, i) => ({
        id: `msg-${i}`,
        createdAt: new Date(),
      }));
      qb.getMany.mockResolvedValue(mockMessages);
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMessages('conv-1', undefined, 50);

      expect(messageRepo.createQueryBuilder).toHaveBeenCalledWith('message');
      expect(qb.where).toHaveBeenCalledWith(
        'message.conversationId = :conversationId',
        { conversationId: 'conv-1' },
      );
      expect(qb.take).toHaveBeenCalledWith(51);
      expect(qb.orderBy).toHaveBeenCalledWith('message.createdAt', 'DESC');
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(result).toHaveLength(50);
    });

    it('should apply cursor filter when cursor is provided', async () => {
      const qb = createMockQb();
      const cursorDate = new Date('2025-01-01T12:00:00Z');
      messageRepo.findOne.mockResolvedValue({ id: 'msg-25', createdAt: cursorDate });
      const mockMessages = Array.from({ length: 26 }, (_, i) => ({
        id: `msg-${i}`,
        createdAt: new Date('2025-01-01T11:59:00Z'),
      }));
      qb.getMany.mockResolvedValue(mockMessages);
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMessages('conv-1', 'msg-25', 25);

      expect(messageRepo.findOne).toHaveBeenCalledWith({ where: { id: 'msg-25' } });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'message.createdAt < :cursorDate',
        { cursorDate },
      );
      expect(qb.take).toHaveBeenCalledWith(26);
      expect(result).toHaveLength(25);
    });

    it('should ignore invalid cursor and return first page', async () => {
      const qb = createMockQb();
      messageRepo.findOne.mockResolvedValue(null);
      const mockMessages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        createdAt: new Date(),
      }));
      qb.getMany.mockResolvedValue(mockMessages);
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMessages('conv-1', 'nonexistent', 50);

      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(result).toHaveLength(50);
    });

    it('should return fewer messages when no more pages exist', async () => {
      const qb = createMockQb();
      const mockMessages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        createdAt: new Date(),
      }));
      qb.getMany.mockResolvedValue(mockMessages);
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMessages('conv-1', undefined, 50);
      expect(result).toHaveLength(10);
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
