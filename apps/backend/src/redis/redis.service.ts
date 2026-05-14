import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private connected = false;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.connected = true;
      this.logger.log('Redis client connected');
    });

    this.client.on('ready', () => {
      this.connected = true;
    });

    this.client.on('error', (err) => {
      this.connected = false;
      this.logger.error('Redis client error', err);
    });

    this.client.on('close', () => {
      this.connected = false;
    });
  }

  isAvailable(): boolean {
    return this.connected;
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      this.logger.warn(`Redis GET failed for key: ${key}`);
      return null;
    }
  }

  async set(key: string, value: string): Promise<string> {
    try {
      return await this.client.set(key, value);
    } catch {
      this.logger.warn(`Redis SET failed for key: ${key}`);
      return 'OK';
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch {
      this.logger.warn(`Redis DEL failed for key: ${key}`);
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch {
      this.logger.warn(`Redis EXISTS failed for key: ${key}`);
      return 0;
    }
  }

  async setEx(key: string, value: string, ttlSeconds: number): Promise<string> {
    try {
      return await this.client.setex(key, ttlSeconds, value);
    } catch {
      this.logger.warn(`Redis SETEX failed for key: ${key}`);
      return 'OK';
    }
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hset(key, field, value);
    } catch {
      this.logger.warn(`Redis HSET failed for key: ${key}, field: ${field}`);
      return 0;
    }
  }

  async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch {
      this.logger.warn(`Redis HGET failed for key: ${key}, field: ${field}`);
      return null;
    }
  }

  async hDel(key: string, field: string): Promise<number> {
    try {
      return await this.client.hdel(key, field);
    } catch {
      this.logger.warn(`Redis HDEL failed for key: ${key}, field: ${field}`);
      return 0;
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch {
      this.logger.warn(`Redis HGETALL failed for key: ${key}`);
      return {};
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch {
      this.logger.warn(`Redis KEYS failed for pattern: ${pattern}`);
      return [];
    }
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    try {
      await this.setEx(`blacklist:token:${token}`, '1', expiresIn);
    } catch {
      this.logger.warn('Failed to blacklist token — token will remain valid');
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.exists(`blacklist:token:${token}`);
      return result === 1;
    } catch {
      this.logger.warn('Failed to check token blacklist — treating as not blacklisted');
      return false;
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
