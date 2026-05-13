import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly defaultTtl = 300; // 5 minutes

  constructor(private readonly redisService: RedisService) {}

  async getCached<T>(key: string): Promise<T | null> {
    const data = await this.redisService.get(`cache:${key}`);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async setCache(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redisService.setEx(`cache:${key}`, serialized, ttl);
    } else {
      await this.redisService.setEx(`cache:${key}`, serialized, this.defaultTtl);
    }
  }

  async invalidateCache(key: string): Promise<void> {
    await this.redisService.del(`cache:${key}`);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const client = this.redisService.getClient();
    const keys = await client.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  // --- User Profile Caching ---

  async getCachedUserProfile(userId: string): Promise<any | null> {
    return this.getCached(`user:profile:${userId}`);
  }

  async setUserProfileCache(userId: string, profile: any, ttl?: number): Promise<void> {
    await this.setCache(`user:profile:${userId}`, profile, ttl);
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    await this.invalidateCache(`user:profile:${userId}`);
  }

  // --- Conversation List Caching ---

  async getCachedConversations(userId: string): Promise<any | null> {
    return this.getCached(`user:conversations:${userId}`);
  }

  async setConversationsCache(userId: string, conversations: any, ttl?: number): Promise<void> {
    await this.setCache(`user:conversations:${userId}`, conversations, ttl);
  }

  async invalidateConversations(userId: string): Promise<void> {
    await this.invalidateCache(`user:conversations:${userId}`);
  }
}
