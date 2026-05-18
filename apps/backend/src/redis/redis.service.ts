import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

function buildRedisClient(): Redis {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (restUrl && restToken) {
    // Upstash: derive host from REST URL (https://<host>) and connect via ioredis + TLS
    const host = restUrl.replace(/^https?:\/\//, '');
    return new Redis({ host, port: 6379, password: restToken, tls: {} });
  }

  // Local Docker fallback
  const host = process.env.REDIS_HOST || 'localhost';
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD || undefined;
  const tls = process.env.REDIS_TLS === 'true' ? {} : undefined;
  return new Redis({ host, port, password, tls });
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = buildRedisClient();

    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const strValue = JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, strValue);
    } else {
      await this.client.set(key, strValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async setex(key: string, seconds: number, value: any): Promise<void> {
    const strValue = JSON.stringify(value);
    await this.client.setex(key, seconds, strValue);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async flushdb(): Promise<void> {
    await this.client.flushdb();
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
