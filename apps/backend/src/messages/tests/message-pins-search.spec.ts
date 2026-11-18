import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MAX_PINNED_MESSAGES, MessageService } from '../message.service';
import { Services } from '../../utils/constants';
import { Message } from '../../utils/typeorm';
import {
  createMockRepository,
  mockConversationsService,
  mockMessageAttachmentsService,
  mockFriendsService,
} from '../../__mocks__';

describe('MessageService - pins and search', () => {
  let service: MessageService;
  let messageRepo: ReturnType<typeof createMockRepository>;
  const conversation = { id: 'c1', creator: { id: 'u1' }, recipient: { id: 'u2' } };

  const queryBuilder = (overrides: Record<string, jest.Mock> = {}) => {
    const qb: any = {};
    for (const fn of ['where', 'andWhere', 'leftJoinAndSelect', 'orderBy', 'take']) {
      qb[fn] = jest.fn().mockReturnValue(qb);
    }
    qb.getCount = jest.fn().mockResolvedValue(0);
    qb.getMany = jest.fn().mockResolvedValue([]);
    return Object.assign(qb, overrides);
  };

  beforeEach(async () => {
    messageRepo = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: getRepositoryToken(Message), useValue: messageRepo },
        { provide: Services.CONVERSATIONS, useValue: mockConversationsService },
        { provide: Services.MESSAGE_ATTACHMENTS, useValue: mockMessageAttachmentsService },
        { provide: Services.FRIENDS_SERVICE, useValue: mockFriendsService },
      ],
    }).compile();
    service = module.get(MessageService);
    mockConversationsService.findById.mockResolvedValue(conversation);
  });

  afterEach(() => jest.clearAllMocks());

  describe('assertParticipant', () => {
    it('allows both participants', async () => {
      await expect(service.assertParticipant('u1', 'c1')).resolves.toBeUndefined();
      await expect(service.assertParticipant('u2', 'c1')).resolves.toBeUndefined();
    });

    it('rejects outsiders with 403', async () => {
      await expect(service.assertParticipant('intruder', 'c1')).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('pinMessage', () => {
    it('pins a message and stamps pinnedAt', async () => {
      const message: any = { id: 'm1', pinnedAt: null };
      messageRepo.findOne.mockResolvedValue(message);
      messageRepo.createQueryBuilder.mockReturnValue(queryBuilder());
      messageRepo.save.mockImplementation(async (m: any) => m);

      const result = await service.pinMessage('u1', 'c1', 'm1');

      expect(result.pinnedAt).toBeInstanceOf(Date);
      expect(messageRepo.save).toHaveBeenCalled();
    });

    it('is idempotent for an already pinned message', async () => {
      const pinnedAt = new Date('2025-01-01');
      messageRepo.findOne.mockResolvedValue({ id: 'm1', pinnedAt });

      const result = await service.pinMessage('u1', 'c1', 'm1');

      expect(result.pinnedAt).toBe(pinnedAt);
      expect(messageRepo.save).not.toHaveBeenCalled();
    });

    it(`refuses more than ${MAX_PINNED_MESSAGES} pins`, async () => {
      messageRepo.findOne.mockResolvedValue({ id: 'm1', pinnedAt: null });
      messageRepo.createQueryBuilder.mockReturnValue(
        queryBuilder({ getCount: jest.fn().mockResolvedValue(MAX_PINNED_MESSAGES) }),
      );

      await expect(service.pinMessage('u1', 'c1', 'm1')).rejects.toBeInstanceOf(HttpException);
      expect(messageRepo.save).not.toHaveBeenCalled();
    });

    it('rejects non-participants before touching messages', async () => {
      await expect(service.pinMessage('intruder', 'c1', 'm1')).rejects.toMatchObject({ status: 403 });
      expect(messageRepo.findOne).not.toHaveBeenCalled();
    });

    it('404s for a message outside the conversation', async () => {
      messageRepo.findOne.mockResolvedValue(null);
      await expect(service.pinMessage('u1', 'c1', 'nope')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('unpinMessage', () => {
    it('clears pinnedAt', async () => {
      messageRepo.findOne.mockResolvedValue({ id: 'm1', pinnedAt: new Date() });
      messageRepo.save.mockImplementation(async (m: any) => m);

      const result = await service.unpinMessage('u1', 'c1', 'm1');

      expect(result.pinnedAt).toBeNull();
    });
  });

  describe('searchMessages', () => {
    it('returns nothing for a blank query without hitting the database', async () => {
      await expect(service.searchMessages('u1', 'c1', '   ')).resolves.toEqual([]);
      expect(messageRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('binds the query as a parameter and caps its length', async () => {
      const qb = queryBuilder();
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      await service.searchMessages('u1', 'c1', `${'x'.repeat(500)}'; DROP TABLE messages;--`);

      const tsCall = qb.andWhere.mock.calls.find((c: any[]) => String(c[0]).includes('plainto_tsquery'));
      expect(tsCall).toBeDefined();
      expect(tsCall[0]).not.toContain('DROP');
      expect(tsCall[1].q).toHaveLength(100);
    });

    it('rejects non-participants', async () => {
      await expect(service.searchMessages('intruder', 'c1', 'hi')).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('existing reads honour the participant check when a user is supplied', () => {
    it('getMessages rejects outsiders', async () => {
      await expect(service.getMessages('c1', undefined, 50, 'intruder')).rejects.toMatchObject({ status: 403 });
    });

    it('getThreadReplies rejects outsiders', async () => {
      await expect(service.getThreadReplies('m1', 'intruder', 'c1')).rejects.toMatchObject({ status: 403 });
    });
  });
});
