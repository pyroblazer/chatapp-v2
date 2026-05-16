import { Injectable, Logger, Optional } from '@nestjs/common';
import type { AuthenticatedSocket } from '../utils/interfaces';
import { RedisService } from '../redis/redis.service';

export interface IGatewaySessionManager {
  getUserSocket(id: string): AuthenticatedSocket | undefined;
  setUserSocket(id: string, socket: AuthenticatedSocket): void;
  removeUserSocket(id: string): void;
  getSockets(): Map<string, AuthenticatedSocket>;
  setUserOnline(userId: string, socketId: string): Promise<void>;
  setUserOffline(userId: string, socketId: string): Promise<void>;
  getOnlineUsers(): Promise<Record<string, string>>;
  isUserOnline(userId: string): Promise<boolean>;
}

@Injectable()
export class GatewaySessionManager implements IGatewaySessionManager {
  private readonly logger = new Logger(GatewaySessionManager.name);
  private readonly sessions: Map<string, AuthenticatedSocket> = new Map();
  private readonly PRESENCE_KEY = 'presence:online';
  private redisAvailable = false;

  constructor(@Optional() private readonly redisService?: RedisService) {
    this.redisAvailable = !!this.redisService;
    if (this.redisAvailable) {
      this.logger.log('Redis-based presence tracking enabled');
    } else {
      this.logger.log(
        'Using in-memory session management (Redis not available)',
      );
    }
  }

  getUserSocket(id: string): AuthenticatedSocket | undefined {
    return this.sessions.get(id);
  }

  setUserSocket(userId: string, socket: AuthenticatedSocket): void {
    this.sessions.set(userId, socket);
    if (this.redisAvailable && this.redisService && socket.user) {
      this.setUserOnline(socket.user.id, socket.id).catch((err: unknown) => {
        this.logger.warn('Failed to set user online in Redis', err);
      });
    }
  }

  removeUserSocket(userId: string): void {
    const socket = this.sessions.get(userId);
    if (this.redisAvailable && this.redisService && socket?.user) {
      this.setUserOffline(socket.user.id, socket.id).catch((err: unknown) => {
        this.logger.warn('Failed to set user offline in Redis', err);
      });
    }
    this.sessions.delete(userId);
  }

  getSockets(): Map<string, AuthenticatedSocket> {
    return this.sessions;
  }

  async setUserOnline(userId: string, socketId: string): Promise<void> {
    if (!this.redisAvailable || !this.redisService) return;
    try {
      await this.redisService.hSet(this.PRESENCE_KEY, userId, socketId);
    } catch (err: unknown) {
      this.logger.warn('Failed to set user online in Redis', err);
    }
  }

  async setUserOffline(userId: string, socketId: string): Promise<void> {
    if (!this.redisAvailable || !this.redisService) return;
    try {
      // Only remove if the stored socketId matches the disconnecting socket
      const storedSocketId = await this.redisService.hGet(
        this.PRESENCE_KEY,
        userId,
      );
      if (storedSocketId === socketId) {
        await this.redisService.hDel(this.PRESENCE_KEY, userId);
      }
    } catch (err: unknown) {
      this.logger.warn('Failed to set user offline in Redis', err);
    }
  }

  async getOnlineUsers(): Promise<Record<string, string>> {
    if (!this.redisAvailable || !this.redisService) {
      // Fallback to in-memory sessions
      const result: Record<string, string> = {};
      this.sessions.forEach((socket, userId) => {
        result[userId] = socket.id;
      });
      return result;
    }
    try {
      return await this.redisService.hGetAll(this.PRESENCE_KEY);
    } catch {
      return {};
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    if (!this.redisAvailable || !this.redisService) {
      // Fallback: check in-memory sessions
      for (const [id] of this.sessions) {
        if (id === userId) return true;
      }
      return false;
    }
    try {
      const socketId = await this.redisService.hGet(this.PRESENCE_KEY, userId);
      return !!socketId;
    } catch {
      return false;
    }
  }
}
