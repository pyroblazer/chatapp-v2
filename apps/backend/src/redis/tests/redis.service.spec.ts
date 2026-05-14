const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDel = jest.fn();
const mockExists = jest.fn();
const mockSetex = jest.fn();
const mockHset = jest.fn();
const mockHget = jest.fn();
const mockHdel = jest.fn();
const mockHgetall = jest.fn();
const mockKeys = jest.fn();
const mockPing = jest.fn();
const mockDisconnect = jest.fn();
const mockOn = jest.fn();

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    on: mockOn,
    get: mockGet,
    set: mockSet,
    del: mockDel,
    exists: mockExists,
    setex: mockSetex,
    hset: mockHset,
    hget: mockHget,
    hdel: mockHdel,
    hgetall: mockHgetall,
    keys: mockKeys,
    ping: mockPing,
    disconnect: mockDisconnect,
  })),
);

import { RedisService } from '../redis.service';

describe('RedisService', () => {
  let service: RedisService;

  function setConnected(connected: boolean) {
    (service as any).connected = connected;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockOn.mockImplementation(() => {});
    service = new RedisService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('isAvailable', () => {
    it('returns false initially before connect event', () => {
      expect(service.isAvailable()).toBe(false);
    });

    it('returns true after connected is set', () => {
      setConnected(true);
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('get', () => {
    it('returns value when Redis is up', async () => {
      mockGet.mockResolvedValueOnce('cached-value');
      expect(await service.get('key')).toBe('cached-value');
    });

    it('returns null on error', async () => {
      mockGet.mockRejectedValueOnce(new Error('conn error'));
      expect(await service.get('key')).toBeNull();
    });
  });

  describe('set', () => {
    it('sets value and returns OK', async () => {
      mockSet.mockResolvedValueOnce('OK');
      expect(await service.set('key', 'val')).toBe('OK');
    });

    it('returns OK on error (safe fallback)', async () => {
      mockSet.mockRejectedValueOnce(new Error('fail'));
      expect(await service.set('key', 'val')).toBe('OK');
    });
  });

  describe('del', () => {
    it('deletes key and returns count', async () => {
      mockDel.mockResolvedValueOnce(1);
      expect(await service.del('key')).toBe(1);
    });

    it('returns 0 on error', async () => {
      mockDel.mockRejectedValueOnce(new Error('fail'));
      expect(await service.del('key')).toBe(0);
    });
  });

  describe('exists', () => {
    it('returns 1 when key exists', async () => {
      mockExists.mockResolvedValueOnce(1);
      expect(await service.exists('key')).toBe(1);
    });

    it('returns 0 on error', async () => {
      mockExists.mockRejectedValueOnce(new Error('fail'));
      expect(await service.exists('key')).toBe(0);
    });
  });

  describe('setEx', () => {
    it('sets key with TTL', async () => {
      mockSetex.mockResolvedValueOnce('OK');
      expect(await service.setEx('key', 'val', 60)).toBe('OK');
      expect(mockSetex).toHaveBeenCalledWith('key', 60, 'val');
    });

    it('returns OK on error', async () => {
      mockSetex.mockRejectedValueOnce(new Error('fail'));
      expect(await service.setEx('key', 'val', 60)).toBe('OK');
    });
  });

  describe('hash operations', () => {
    it('hSet sets field value', async () => {
      mockHset.mockResolvedValueOnce(1);
      expect(await service.hSet('hash', 'field', 'val')).toBe(1);
    });

    it('hSet returns 0 on error', async () => {
      mockHset.mockRejectedValueOnce(new Error('fail'));
      expect(await service.hSet('hash', 'field', 'val')).toBe(0);
    });

    it('hGet returns value', async () => {
      mockHget.mockResolvedValueOnce('field-value');
      expect(await service.hGet('hash', 'field')).toBe('field-value');
    });

    it('hGet returns null on error', async () => {
      mockHget.mockRejectedValueOnce(new Error('fail'));
      expect(await service.hGet('hash', 'field')).toBeNull();
    });

    it('hDel removes field', async () => {
      mockHdel.mockResolvedValueOnce(1);
      expect(await service.hDel('hash', 'field')).toBe(1);
    });

    it('hDel returns 0 on error', async () => {
      mockHdel.mockRejectedValueOnce(new Error('fail'));
      expect(await service.hDel('hash', 'field')).toBe(0);
    });

    it('hGetAll returns object', async () => {
      mockHgetall.mockResolvedValueOnce({ a: '1', b: '2' });
      expect(await service.hGetAll('hash')).toEqual({ a: '1', b: '2' });
    });

    it('hGetAll returns empty object on error', async () => {
      mockHgetall.mockRejectedValueOnce(new Error('fail'));
      expect(await service.hGetAll('hash')).toEqual({});
    });
  });

  describe('keys', () => {
    it('returns matching keys', async () => {
      mockKeys.mockResolvedValueOnce(['a:1', 'a:2']);
      expect(await service.keys('a:*')).toEqual(['a:1', 'a:2']);
    });

    it('returns empty array on error', async () => {
      mockKeys.mockRejectedValueOnce(new Error('fail'));
      expect(await service.keys('a:*')).toEqual([]);
    });
  });

  describe('ping', () => {
    it('passes through to client', async () => {
      mockPing.mockResolvedValueOnce('PONG');
      expect(await service.ping()).toBe('PONG');
    });
  });

  describe('blacklistToken / isTokenBlacklisted', () => {
    it('blacklists token by setting key with TTL', async () => {
      mockSetex.mockResolvedValueOnce('OK');
      await service.blacklistToken('tok123', 300);
      expect(mockSetex).toHaveBeenCalledWith('blacklist:token:tok123', 300, '1');
    });

    it('does not throw when blacklisting fails', async () => {
      mockSetex.mockRejectedValueOnce(new Error('fail'));
      await expect(service.blacklistToken('tok', 300)).resolves.not.toThrow();
    });

    it('returns true when token is blacklisted', async () => {
      mockExists.mockResolvedValueOnce(1);
      expect(await service.isTokenBlacklisted('tok123')).toBe(true);
    });

    it('returns false when token is not blacklisted', async () => {
      mockExists.mockResolvedValueOnce(0);
      expect(await service.isTokenBlacklisted('tok123')).toBe(false);
    });

    it('returns false on error (safe fallback)', async () => {
      mockExists.mockRejectedValueOnce(new Error('fail'));
      expect(await service.isTokenBlacklisted('tok')).toBe(false);
    });
  });
});
