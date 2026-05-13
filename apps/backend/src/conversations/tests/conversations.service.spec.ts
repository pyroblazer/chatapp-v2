import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationsService } from '../conversations.service';
import { Services } from '../../utils/constants';
import { Conversation, Message, User } from '../../utils/typeorm';
import {
  mockUser,
  createMockRepository,
  mockUserService,
  mockFriendsService,
} from '../../__mocks__';
import { UserNotFoundException } from '../../users/exceptions/UserNotFound';
import { ConversationExistsException } from '../exceptions/ConversationExists';
import { FriendNotFoundException } from '../../friends/exceptions/FriendNotFound';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationRepo: ReturnType<typeof createMockRepository>;
  let messageRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    conversationRepo = createMockRepository();
    messageRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: conversationRepo,
        },
        { provide: getRepositoryToken(Message), useValue: messageRepo },
        { provide: Services.USERS, useValue: mockUserService },
        { provide: Services.FRIENDS_SERVICE, useValue: mockFriendsService },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConversations', () => {
    it('should return conversations for a user', async () => {
      const mockConversations = [{ id: 1, creator: mockUser }];
      // createQueryBuilder returns a new mock each call, so configure it at the factory level
      conversationRepo.createQueryBuilder = jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockConversations),
      });

      const result = await service.getConversations(1 as any);

      expect(result).toEqual(mockConversations);
      expect(conversationRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a conversation by id', async () => {
      const mockConversation = {
        id: 1,
        creator: mockUser,
        recipient: { id: '2' },
      };
      conversationRepo.findOne.mockResolvedValue(mockConversation);

      const result = await service.findById(1);

      expect(result).toEqual(mockConversation);
      expect(conversationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [
          'creator',
          'recipient',
          'creator.profile',
          'recipient.profile',
          'lastMessageSent',
        ],
      });
    });

    it('should return null if conversation not found', async () => {
      conversationRepo.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('createConversation', () => {
    const creator = { ...mockUser, id: '1' } as unknown as User;
    const recipient = {
      ...mockUser,
      id: '2',
      username: 'recipient',
    } as unknown as User;

    it('should throw UserNotFoundException if recipient not found', async () => {
      mockUserService.findUser.mockResolvedValue(null);

      await expect(
        service.createConversation(creator, {
          username: 'nonexistent',
          message: 'hello',
        }),
      ).rejects.toThrow(UserNotFoundException);
    });

    it('should throw if creating conversation with yourself', async () => {
      mockUserService.findUser.mockResolvedValue(creator);

      await expect(
        service.createConversation(creator, {
          username: 'testuser',
          message: 'hello',
        }),
      ).rejects.toThrow('Cannot create Conversation with yourself');
    });

    it('should throw FriendNotFoundException if users are not friends', async () => {
      mockUserService.findUser.mockResolvedValue(recipient);
      mockFriendsService.isFriends.mockResolvedValue(false);

      await expect(
        service.createConversation(creator, {
          username: 'recipient',
          message: 'hello',
        }),
      ).rejects.toThrow(FriendNotFoundException);
    });

    it('should throw ConversationExistsException if conversation already exists', async () => {
      mockUserService.findUser.mockResolvedValue(recipient);
      mockFriendsService.isFriends.mockResolvedValue(true);
      conversationRepo.findOne.mockResolvedValue({ id: 99 });

      await expect(
        service.createConversation(creator, {
          username: 'recipient',
          message: 'hello',
        }),
      ).rejects.toThrow(ConversationExistsException);
    });

    it('should create a conversation with initial message', async () => {
      mockUserService.findUser.mockResolvedValue(recipient);
      mockFriendsService.isFriends.mockResolvedValue(true);
      conversationRepo.findOne.mockResolvedValue(null);

      const savedConversation = { id: 1, creator, recipient };
      conversationRepo.create.mockReturnValue(savedConversation);
      conversationRepo.save.mockResolvedValue(savedConversation);
      messageRepo.create.mockReturnValue({
        content: 'hello',
        conversation: savedConversation,
      });
      messageRepo.save.mockResolvedValue({});

      const result = await service.createConversation(creator, {
        username: 'recipient',
        message: 'hello',
      });

      expect(result).toEqual(savedConversation);
      expect(conversationRepo.save).toHaveBeenCalled();
      expect(messageRepo.save).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should save and return the conversation', async () => {
      const conversation = { id: 1 } as unknown as Conversation;
      conversationRepo.save.mockResolvedValue(conversation);

      const result = await service.save(conversation);

      expect(result).toEqual(conversation);
      expect(conversationRepo.save).toHaveBeenCalledWith(conversation);
    });
  });
});
