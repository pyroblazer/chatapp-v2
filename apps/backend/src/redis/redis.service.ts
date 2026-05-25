import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

const REDIS_OPTS = {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
  keepAlive: 10000,
  retryStrategy: (times: number) => {
    if (times > 10) return null; // stop retrying after 10 consecutive failures
    return Math.min(times * 1000, 10000);
  },
};

function buildRedisClient(): Redis {
  const url = process.env.REDIS_URL;
  if (url) {
    return new Redis(url, REDIS_OPTS);
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD || undefined;
  return new Redis({ host, port, password, ...REDIS_OPTS });
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private connected = false;

  constructor() {
    this.client = buildRedisClient();
    this.client.on('connect', () => { this.connected = true; });
    this.client.on('close', () => { this.connected = false; });
    this.client.on('error', (err) => { this.logger.warn(`Redis connection error: ${err.message}`); });
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
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<string> {
    try {
      if (ttl) return await this.client.setex(key, ttl, value);
      return await this.client.set(key, value);
    } catch {
      return 'OK';
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch {
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch {
      return 0;
    }
  }

  async setEx(key: string, value: string, ttl: number): Promise<string> {
    try {
      return await this.client.setex(key, ttl, value);
    } catch {
      return 'OK';
    }
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hset(key, field, value);
    } catch {
      return 0;
    }
  }

  async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch {
      return null;
    }
  }

  async hDel(key: string, field: string): Promise<number> {
    try {
      return await this.client.hdel(key, field);
    } catch {
      return 0;
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key) ?? {};
    } catch {
      return {};
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch {
      return [];
    }
  }

  async flushdb(): Promise<void> {
    await this.client.flushdb();
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.setex(`blacklist:token:${token}`, ttlSeconds, '1');
    } catch {
      // non-critical
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.client.exists(`blacklist:token:${token}`);
      return result === 1;
    } catch {
      return false;
    }
  }

  onModuleDestroy() {
    if (this.client) this.client.disconnect();
  }
}
