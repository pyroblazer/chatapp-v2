import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/typeorm';
import { HealthController } from '../health.controller';
import { RedisService } from '../../redis/redis.service';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { StorageService } from '../../storage/storage.service';
import { AiService } from '../../bot/ai/ai.service';
import { KafkaService } from '../../kafka/kafka.service';

describe('HealthController', () => {
  let controller: HealthController;
  let redisService: any;
  let rabbitMQService: any;
  let storageService: any;
  let aiService: any;
  let kafkaService: any;
  let mockConnection: any;

  beforeEach(async () => {
    mockConnection = {
      isConnected: true,
      query: jest.fn().mockResolvedValue([{ result: 1 }]),
    };

    redisService = {
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    rabbitMQService = {
      isAvailable: jest.fn().mockReturnValue(true),
    };

    storageService = {
      isAvailable: jest.fn().mockReturnValue(true),
    };

    aiService = {
      isAvailable: jest.fn().mockReturnValue(true),
    };

    kafkaService = {
      isAvailable: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: RedisService, useValue: redisService },
        { provide: RabbitMQService, useValue: rabbitMQService },
        { provide: StorageService, useValue: storageService },
        { provide: AiService, useValue: aiService },
        { provide: KafkaService, useValue: kafkaService },
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
      expect(result.services.rabbitmq).toBe('up');
      expect(result.services.minio).toBe('up');
      expect(result.services.ollama).toBe('up');
      expect(result.services.kafka).toBe('up');
      expect(result.timestamp).toBeDefined();
    });

    it('should return down status when postgresql is down', async () => {
      mockConnection.isConnected = false;

      const result = await controller.check();

      expect(result.status).toBe('down');
      expect(result.services.postgresql).toBe('down');
    });

    it('should return down status when postgresql query throws', async () => {
      mockConnection.query.mockRejectedValue(new Error('Connection lost'));

      const result = await controller.check();

      expect(result.status).toBe('down');
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

    it('should return degraded status when rabbitmq is down', async () => {
      rabbitMQService.isAvailable.mockReturnValue(false);

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.services.rabbitmq).toBe('down');
    });

    it('should return degraded status when minio is down', async () => {
      storageService.isAvailable.mockReturnValue(false);

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.services.minio).toBe('down');
    });

    it('should return degraded status when ollama is down', async () => {
      aiService.isAvailable.mockReturnValue(false);

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.services.ollama).toBe('down');
    });

    it('should return down when postgresql is down even if all non-critical services are down', async () => {
      mockConnection.isConnected = false;
      redisService.ping.mockRejectedValue(new Error('down'));
      rabbitMQService.isAvailable.mockReturnValue(false);
      storageService.isAvailable.mockReturnValue(false);
      aiService.isAvailable.mockReturnValue(false);
      kafkaService.isAvailable.mockReturnValue(false);

      const result = await controller.check();

      expect(result.status).toBe('down');
      expect(result.services.postgresql).toBe('down');
      expect(result.services.redis).toBe('down');
      expect(result.services.rabbitmq).toBe('down');
      expect(result.services.minio).toBe('down');
      expect(result.services.ollama).toBe('down');
    });
  });
});
