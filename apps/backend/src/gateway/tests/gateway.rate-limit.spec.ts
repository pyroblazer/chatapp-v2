import { SocketRateLimiter } from '../gateway.rate-limit';

describe('SocketRateLimiter', () => {
  let limiter: SocketRateLimiter;

  beforeEach(() => {
    limiter = new SocketRateLimiter();
  });

  it('should allow events that have no configured limit', () => {
    expect(limiter.isAllowed('socket-1', 'unknownEvent')).toBe(true);
  });

  it('should allow events up to the maximum rate', () => {
    // createMessage: max 10 per 1000ms
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed('socket-1', 'createMessage')).toBe(true);
    }
  });

  it('should block events exceeding the maximum rate', () => {
    for (let i = 0; i < 10; i++) {
      limiter.isAllowed('socket-1', 'createMessage');
    }
    expect(limiter.isAllowed('socket-1', 'createMessage')).toBe(false);
  });

  it('should track buckets per socket independently', () => {
    // Exhaust socket-1
    for (let i = 0; i < 10; i++) {
      limiter.isAllowed('socket-1', 'createMessage');
    }
    expect(limiter.isAllowed('socket-1', 'createMessage')).toBe(false);
    // socket-2 should still be allowed
    expect(limiter.isAllowed('socket-2', 'createMessage')).toBe(true);
  });

  it('should track buckets per event independently', () => {
    // Exhaust createMessage for socket-1
    for (let i = 0; i < 10; i++) {
      limiter.isAllowed('socket-1', 'createMessage');
    }
    expect(limiter.isAllowed('socket-1', 'createMessage')).toBe(false);
    // onTypingStart should still be allowed
    expect(limiter.isAllowed('socket-1', 'onTypingStart')).toBe(true);
  });

  it('should refill tokens over time', () => {
    for (let i = 0; i < 10; i++) {
      limiter.isAllowed('socket-1', 'createMessage');
    }
    expect(limiter.isAllowed('socket-1', 'createMessage')).toBe(false);

    // Advance time by 500ms (should refill ~5 tokens for createMessage)
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 500);
    expect(limiter.isAllowed('socket-1', 'createMessage')).toBe(true);
    jest.restoreAllMocks();
  });

  it('should not exceed max tokens even after long idle', () => {
    // Don't use any tokens, then advance time far ahead
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 60000);
    // Should only get max (10) tokens, not more
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed('socket-1', 'createMessage')).toBe(true);
    }
    expect(limiter.isAllowed('socket-1', 'createMessage')).toBe(false);
    jest.restoreAllMocks();
  });

  it('should clean up all buckets for a socket', () => {
    limiter.isAllowed('socket-1', 'createMessage');
    limiter.isAllowed('socket-1', 'onTypingStart');
    limiter.cleanup('socket-1');
    // After cleanup, socket-1 should get fresh buckets
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed('socket-1', 'createMessage')).toBe(true);
    }
  });

  it('should enforce streamGroupCallInitiated limit (3 per 10s)', () => {
    for (let i = 0; i < 3; i++) {
      expect(limiter.isAllowed('socket-1', 'streamGroupCallInitiated')).toBe(true);
    }
    expect(limiter.isAllowed('socket-1', 'streamGroupCallInitiated')).toBe(false);
  });

  it('should enforce streamCallInitiated limit (5 per 10s)', () => {
    for (let i = 0; i < 5; i++) {
      expect(limiter.isAllowed('socket-1', 'streamCallInitiated')).toBe(true);
    }
    expect(limiter.isAllowed('socket-1', 'streamCallInitiated')).toBe(false);
  });
});
