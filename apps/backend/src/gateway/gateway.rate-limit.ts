import { Injectable } from '@nestjs/common';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

@Injectable()
export class SocketRateLimiter {
  private readonly buckets = new Map<string, Map<string, Bucket>>();

  private readonly limits: Record<string, { max: number; windowMs: number }> = {
    'createMessage': { max: 10, windowMs: 1000 },
    'onTypingStart': { max: 6, windowMs: 10000 },
    'onTypingStop': { max: 6, windowMs: 10000 },
    'streamCallInitiated': { max: 5, windowMs: 10000 },
    'streamGroupCallInitiated': { max: 3, windowMs: 10000 },
  };

  isAllowed(socketId: string, event: string): boolean {
    const limit = this.limits[event];
    if (!limit) return true;

    let userBuckets = this.buckets.get(socketId);
    if (!userBuckets) {
      userBuckets = new Map();
      this.buckets.set(socketId, userBuckets);
    }

    let bucket = userBuckets.get(event);
    const now = Date.now();
    if (!bucket) {
      bucket = { tokens: limit.max, lastRefill: now };
      userBuckets.set(event, bucket);
    }

    const elapsed = now - bucket.lastRefill;
    const refill = (elapsed / limit.windowMs) * limit.max;
    bucket.tokens = Math.min(limit.max, bucket.tokens + refill);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  cleanup(socketId: string): void {
    this.buckets.delete(socketId);
  }
}
