import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Call, CallParticipant } from '../utils/typeorm';
import { createMockRepository } from '../__mocks__';
import { CallHistoryService, CreateCallParams } from './call-history.service';

describe('CallHistoryService', () => {
  let service: CallHistoryService;
  let callRepo: ReturnType<typeof createMockRepository>;
  let participantRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    callRepo = createMockRepository();
    participantRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallHistoryService,
        { provide: getRepositoryToken(Call), useValue: callRepo },
        { provide: getRepositoryToken(CallParticipant), useValue: participantRepo },
      ],
    }).compile();

    service = module.get<CallHistoryService>(CallHistoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCall', () => {
    it('should create a DM call with recipientId', async () => {
      const params: CreateCallParams = {
        callerId: 'caller-1',
        recipientId: 'recipient-1',
        conversationId: 'conv-1',
        callType: 'audio',
      };
      const callEntity = { id: 'call-1', ...params, status: 'initiated' };
      callRepo.create.mockReturnValue(callEntity);
      callRepo.save.mockResolvedValue(callEntity);

      const result = await service.createCall(params);

      expect(callRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          callerId: 'caller-1',
          recipientId: 'recipient-1',
          conversationId: 'conv-1',
          callType: 'audio',
          status: 'initiated',
        }),
      );
      expect(callRepo.save).toHaveBeenCalledWith(callEntity);
      expect(participantRepo.create).not.toHaveBeenCalled();
      expect(result).toEqual(callEntity);
    });

    it('should create a group call with participants (filtering caller)', async () => {
      const params: CreateCallParams = {
        callerId: 'caller-1',
        groupId: 'group-1',
        callType: 'video',
        participantIds: ['caller-1', 'user-2', 'user-3'],
      };
      const callEntity = { id: 'call-1', callerId: 'caller-1', groupId: 'group-1', callType: 'video', status: 'initiated' };
      callRepo.create.mockReturnValue(callEntity);
      callRepo.save.mockResolvedValue(callEntity);

      const p1 = { callId: 'call-1', userId: 'user-2', status: 'invited' };
      const p2 = { callId: 'call-1', userId: 'user-3', status: 'invited' };
      participantRepo.create.mockReturnValueOnce(p1).mockReturnValueOnce(p2);

      const result = await service.createCall(params);

      expect(participantRepo.create).toHaveBeenCalledTimes(2);
      expect(participantRepo.create).toHaveBeenCalledWith({
        callId: 'call-1',
        userId: 'user-2',
        status: 'invited',
      });
      expect(participantRepo.create).toHaveBeenCalledWith({
        callId: 'call-1',
        userId: 'user-3',
        status: 'invited',
      });
      expect(participantRepo.save).toHaveBeenCalledWith([p1, p2]);
      expect(result).toEqual(callEntity);
    });

    it('should not create participants for a DM call', async () => {
      const params: CreateCallParams = {
        callerId: 'caller-1',
        recipientId: 'recipient-1',
        callType: 'audio',
      };
      callRepo.create.mockReturnValue({ id: 'call-1' });
      callRepo.save.mockResolvedValue({ id: 'call-1' });

      await service.createCall(params);
      expect(participantRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update call status and return the updated call', async () => {
      const updatedCall = { id: 'call-1', status: 'ongoing' };
      callRepo.update.mockResolvedValue({ affected: 1 });
      callRepo.findOne.mockResolvedValue(updatedCall);

      const result = await service.updateStatus('call-1', 'ongoing');

      expect(callRepo.update).toHaveBeenCalledWith('call-1', { status: 'ongoing' });
      expect(result).toEqual(updatedCall);
    });

    it('should return null if call not found after update', async () => {
      callRepo.update.mockResolvedValue({ affected: 0 });
      callRepo.findOne.mockResolvedValue(null);

      const result = await service.updateStatus('nonexistent', 'ongoing');
      expect(result).toBeNull();
    });
  });

  describe('endCall', () => {
    it('should set status to ended and calculate duration', async () => {
      const initiatedAt = new Date('2025-01-01T10:00:00Z');
      callRepo.findOne
        .mockResolvedValueOnce({ id: 'call-1', initiatedAt })
        .mockResolvedValueOnce({ id: 'call-1', status: 'ended' });
      callRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.endCall('call-1');

      expect(callRepo.update).toHaveBeenCalledWith(
        'call-1',
        expect.objectContaining({
          status: 'ended',
          endedAt: expect.any(Date),
          durationSeconds: expect.any(Number),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should return null if call does not exist', async () => {
      callRepo.findOne.mockResolvedValue(null);
      const result = await service.endCall('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateParticipantStatus', () => {
    it('should update participant status', async () => {
      await service.updateParticipantStatus('call-1', 'user-1', 'accepted');
      expect(participantRepo.update).toHaveBeenCalledWith(
        { callId: 'call-1', userId: 'user-1' },
        { status: 'accepted' },
      );
    });
  });

  describe('endCallForParticipant', () => {
    it('should mark participant as left', async () => {
      await service.endCallForParticipant('call-1', 'user-1');
      expect(participantRepo.update).toHaveBeenCalledWith(
        { callId: 'call-1', userId: 'user-1' },
        { status: 'left' },
      );
    });
  });

  describe('getCallHistory', () => {
    it('should return paginated call history with group and participant relations', async () => {
      const calls = [{ id: 'call-1' }, { id: 'call-2' }];
      callRepo.findAndCount.mockResolvedValue([calls, 2]);

      const [result, total] = await service.getCallHistory('user-1', 50, 0);

      expect(callRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ callerId: 'user-1' }, { recipientId: 'user-1' }],
          relations: expect.arrayContaining([
            'caller', 'recipient', 'caller.profile', 'recipient.profile',
            'group', 'participants', 'participants.user', 'participants.user.profile',
          ]),
          order: { initiatedAt: 'DESC' },
          take: 50,
          skip: 0,
        }),
      );
      expect(total).toBe(2);
    });
  });

  describe('getCallParticipants', () => {
    it('should return participants with user relations', async () => {
      const participants = [
        { callId: 'call-1', userId: 'user-1', status: 'accepted', user: {} },
      ];
      participantRepo.find.mockResolvedValue(participants);

      const result = await service.getCallParticipants('call-1');

      expect(participantRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { callId: 'call-1' },
          relations: ['user', 'user.profile'],
        }),
      );
      expect(result).toEqual(participants);
    });
  });
});
