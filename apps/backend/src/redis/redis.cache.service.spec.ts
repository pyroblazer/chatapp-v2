import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from './redis.cache.service';
import { RedisService } from './redis.service';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let redisService: Record<string, jest.Mock>;
  let scanClient: Record<string, jest.Mock>;

  beforeEach(async () => {
    scanClient = {
      scan: jest.fn(),
      del: jest.fn(),
    };
    redisService = {
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      getClient: jest.fn().mockReturnValue(scanClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
  });

  describe('getCached', () => {
    it('should return parsed cached value', async () => {
      redisService.get.mockResolvedValue(JSON.stringify({ name: 'test' }));
      const result = await service.getCached('my-key');
      expect(redisService.get).toHaveBeenCalledWith('cache:my-key');
      expect(result).toEqual({ name: 'test' });
    });

    it('should return null for missing key', async () => {
      redisService.get.mockResolvedValue(null);
      const result = await service.getCached('missing');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      redisService.get.mockResolvedValue('not-json{{{');
      const result = await service.getCached('bad');
      expect(result).toBeNull();
    });

    it('should return null and log warning on Redis error', async () => {
      redisService.get.mockRejectedValue(new Error('connection lost'));
      const result = await service.getCached('error-key');
      expect(result).toBeNull();
    });
  });

  describe('setCache', () => {
    it('should serialize and store with default TTL', async () => {
      await service.setCache('key', { foo: 'bar' });
      expect(redisService.setEx).toHaveBeenCalledWith(
        'cache:key',
        JSON.stringify({ foo: 'bar' }),
        300,
      );
    });

    it('should use custom TTL when provided', async () => {
      await service.setCache('key', 'value', 600);
      expect(redisService.setEx).toHaveBeenCalledWith('cache:key', '"value"', 600);
    });
  });

  describe('invalidateCache', () => {
    it('should delete the cache key', async () => {
      await service.invalidateCache('key');
      expect(redisService.del).toHaveBeenCalledWith('cache:key');
    });
  });

  describe('invalidatePattern', () => {
    it('should use SCAN instead of KEYS to find matching keys', async () => {
      const keys = ['cache:user:profile:1', 'cache:user:profile:2'];
      // First scan returns keys and cursor '0' (done)
      scanClient.scan.mockResolvedValueOnce(['0', keys]);
      scanClient.del.mockResolvedValue(2);

      await service.invalidatePattern('user:profile:*');

      expect(scanClient.scan).toHaveBeenCalledWith('0', 'MATCH', 'cache:user:profile:*', 'COUNT', 100);
      expect(scanClient.del).toHaveBeenCalledWith(...keys);
    });

    it('should iterate multiple SCAN batches', async () => {
      // First batch returns cursor '42' (more to scan)
      scanClient.scan.mockResolvedValueOnce(['42', ['cache:k1']]);
      // Second batch returns cursor '0' (done)
      scanClient.scan.mockResolvedValueOnce(['0', ['cache:k2']]);

      await service.invalidatePattern('k*');

      expect(scanClient.scan).toHaveBeenCalledTimes(2);
      expect(scanClient.scan).toHaveBeenCalledWith('0', 'MATCH', 'cache:k*', 'COUNT', 100);
      expect(scanClient.scan).toHaveBeenCalledWith('42', 'MATCH', 'cache:k*', 'COUNT', 100);
    });

    it('should handle empty scan results', async () => {
      scanClient.scan.mockResolvedValueOnce(['0', []]);

      await service.invalidatePattern('nothing:*');

      expect(scanClient.del).not.toHaveBeenCalled();
    });
  });

  describe('Group member caching', () => {
    it('should cache and retrieve group members', async () => {
      const memberIds = ['user-1', 'user-2', 'user-3'];
      redisService.get.mockResolvedValue(JSON.stringify(memberIds));

      await service.setGroupMembersCache('group-1', memberIds);
      expect(redisService.setEx).toHaveBeenCalledWith(
        'cache:group:members:group-1',
        JSON.stringify(memberIds),
        300,
      );

      const result = await service.getCachedGroupMembers('group-1');
      expect(result).toEqual(memberIds);
    });

    it('should invalidate group members cache', async () => {
      await service.invalidateGroupMembers('group-1');
      expect(redisService.del).toHaveBeenCalledWith('cache:group:members:group-1');
    });
  });
});
