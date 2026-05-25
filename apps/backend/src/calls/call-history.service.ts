import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call, CallStatus, CallType } from '../utils/typeorm/entities/Call';

export interface CreateCallParams {
  callId?: string;
  callerId: string;
  recipientId: string;
  conversationId?: string;
  callType: CallType;
}

@Injectable()
export class CallHistoryService {
  constructor(
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
  ) {}

  async createCall(params: CreateCallParams): Promise<Call> {
    const call = this.callRepository.create({
      ...(params.callId ? { id: params.callId } : {}),
      callerId: params.callerId,
      recipientId: params.recipientId,
      conversationId: params.conversationId || null,
      callType: params.callType,
      status: 'initiated',
    });
    return this.callRepository.save(call);
  }

  async updateStatus(callId: string, status: CallStatus): Promise<Call | null> {
    await this.callRepository.update(callId, { status });
    return this.callRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'recipient', 'caller.profile', 'recipient.profile'],
    });
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

  async getCallHistory(userId: string, limit = 50, offset = 0): Promise<[Call[], number]> {
    return this.callRepository.findAndCount({
      where: [
        { callerId: userId },
        { recipientId: userId },
      ],
      relations: ['caller', 'recipient', 'caller.profile', 'recipient.profile'],
      order: { initiatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
