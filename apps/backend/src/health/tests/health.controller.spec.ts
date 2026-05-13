import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/typeorm';
import { HealthController } from '../health.controller';
import { RedisService } from '../../redis/redis.service';

describe('HealthController', () => {
  let controller: HealthController;
  let redisService: any;
  let mockConnection: any;

  beforeEach(async () => {
    mockConnection = {
      isConnected: true,
      query: jest.fn().mockResolvedValue([{ result: 1 }]),
    };

    redisService = {
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: RedisService, useValue: redisService },
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return ok status when all services are up', async () => {
      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.services.postgresql).toBe('up');
      expect(result.services.redis).toBe('up');
      expect(result.timestamp).toBeDefined();
    });

    it('should return degraded status when postgresql is down', async () => {
      mockConnection.isConnected = false;

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.services.postgresql).toBe('down');
    });

    it('should return degraded status when redis is down', async () => {
      redisService.ping.mockRejectedValue(new Error('Connection refused'));

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.services.redis).toBe('down');
    });

    it('should return degraded status when redis returns unexpected response', async () => {
      redisService.ping.mockResolvedValue('NOT_PONG');

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.services.redis).toBe('down');
    });

    it('should return degraded when postgresql query throws', async () => {
      mockConnection.query.mockRejectedValue(new Error('Connection lost'));

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.services.postgresql).toBe('down');
    });
  });
});
