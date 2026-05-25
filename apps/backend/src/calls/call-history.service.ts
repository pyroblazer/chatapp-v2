import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call, CallStatus, CallType } from '../utils/typeorm/entities/Call';
import { CallParticipant, CallParticipantStatus } from '../utils/typeorm/entities/CallParticipant';

export interface CreateCallParams {
  callId?: string;
  callerId: string;
  recipientId?: string;
  conversationId?: string;
  groupId?: string;
  callType: CallType;
  participantIds?: string[];
}

@Injectable()
export class CallHistoryService {
  constructor(
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    @InjectRepository(CallParticipant)
    private readonly participantRepository: Repository<CallParticipant>,
  ) {}

  async createCall(params: CreateCallParams): Promise<Call> {
    const call = this.callRepository.create({
      ...(params.callId ? { id: params.callId } : {}),
      callerId: params.callerId,
      recipientId: params.recipientId || null,
      conversationId: params.conversationId || null,
      groupId: params.groupId || null,
      callType: params.callType,
      status: 'initiated',
    });
    const saved = await this.callRepository.save(call);

    // Create participant records for group calls
    if (params.participantIds && params.participantIds.length > 0) {
      const participants = params.participantIds
        .filter((id) => id !== params.callerId)
        .map((userId) =>
          this.participantRepository.create({
            callId: saved.id,
            userId,
            status: 'invited',
          }),
        );
      await this.participantRepository.save(participants);
    }

    return saved;
  }

  async updateStatus(callId: string, status: CallStatus): Promise<Call | null> {
    await this.callRepository.update(callId, { status });
    return this.callRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'recipient', 'caller.profile', 'recipient.profile'],
    });
  }

  async updateParticipantStatus(callId: string, userId: string, status: CallParticipantStatus): Promise<void> {
    await this.participantRepository.update(
      { callId, userId },
      { status },
    );
  }

  async endCall(callId: string): Promise<Call | null> {
    const call = await this.callRepository.findOne({ where: { id: callId } });
    if (!call) return null;
    const endedAt = new Date();
    const durationSeconds = call.initiatedAt
      ? Math.round((endedAt.getTime() - call.initiatedAt.getTime()) / 1000)
      : null;
    await this.callRepository.update(callId, {
      status: 'ended',
      endedAt,
      durationSeconds,
    });
    return this.callRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'recipient', 'caller.profile', 'recipient.profile'],
    });
  }

  async endCallForParticipant(callId: string, userId: string): Promise<void> {
    await this.participantRepository.update(
      { callId, userId },
      { status: 'left' },
    );
  }

  async getCallHistory(userId: string, limit = 50, offset = 0): Promise<[Call[], number]> {
    return this.callRepository.findAndCount({
      where: [
        { callerId: userId },
        { recipientId: userId },
      ],
      relations: [
        'caller', 'recipient', 'caller.profile', 'recipient.profile',
        'group', 'participants', 'participants.user', 'participants.user.profile',
      ],
      order: { initiatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getCallParticipants(callId: string): Promise<CallParticipant[]> {
    return this.participantRepository.find({
      where: { callId },
      relations: ['user', 'user.profile'],
    });
  }
}
