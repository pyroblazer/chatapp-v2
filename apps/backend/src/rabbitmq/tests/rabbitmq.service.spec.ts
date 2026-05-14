jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

import * as amqp from 'amqplib';
import { RabbitMQService } from '../rabbitmq.service';

const mockConnect = amqp.connect as jest.Mock;

const mockChannel = {
  prefetch: jest.fn().mockResolvedValue(undefined),
  assertExchange: jest.fn().mockResolvedValue(undefined),
  assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue', messageCount: 0, consumerCount: 0 }),
  bindQueue: jest.fn().mockResolvedValue(undefined),
  sendToQueue: jest.fn().mockReturnValue(true),
  consume: jest.fn().mockResolvedValue({ consumerTag: 'ctag-1' }),
  ack: jest.fn(),
  nack: jest.fn(),
  cancel: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

const mockConnection = {
  createChannel: jest.fn().mockResolvedValue(mockChannel),
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

describe('RabbitMQService', () => {
  let service: RabbitMQService;

  const defaultOptions = {
    host: 'localhost',
    port: 5672,
    username: 'guest',
    password: 'guest',
    vhost: '/',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockChannel.prefetch.mockResolvedValue(undefined);
    mockChannel.assertExchange.mockResolvedValue(undefined);
    mockChannel.assertQueue.mockResolvedValue({ queue: 'test-queue', messageCount: 0, consumerCount: 0 });
    mockChannel.bindQueue.mockResolvedValue(undefined);
    mockChannel.sendToQueue.mockReturnValue(true);
    mockChannel.consume.mockResolvedValue({ consumerTag: 'ctag-1' });
    mockChannel.cancel.mockResolvedValue(undefined);
    mockChannel.close.mockResolvedValue(undefined);
    mockConnection.createChannel.mockResolvedValue(mockChannel);
    mockConnection.close.mockResolvedValue(undefined);
    mockConnect.mockResolvedValue(mockConnection);

    service = new RabbitMQService(defaultOptions);
    await new Promise((resolve) => setImmediate(resolve));
  });

  afterEach(async () => {
    (service as any).isShuttingDown = true;
    if ((service as any).channel) {
      (service as any).channel = null;
    }
  });

  describe('isAvailable', () => {
    it('returns true when channel exists after connect', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('returns false when channel is null', () => {
      (service as any).channel = null;
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('publish', () => {
    it('sends message when channel available', async () => {
      const result = await service.publish('test-queue', { event: 'test' });
      expect(result).toBe(true);
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
    });

    it('returns false when channel is null', async () => {
      (service as any).channel = null;
      const result = await service.publish('test-queue', { event: 'test' });
      expect(result).toBe(false);
      expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
    });

    it('returns false when sendToQueue returns false', async () => {
      mockChannel.sendToQueue.mockReturnValueOnce(false);
      const result = await service.publish('test-queue', { msg: 'x' });
      expect(result).toBe(false);
    });
  });

  describe('consume', () => {
    it('registers consumer when channel available', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await service.consume('test-queue', handler);
      expect(mockChannel.consume).toHaveBeenCalledWith('test-queue', expect.any(Function));
    });

    it('does not throw when channel is null', async () => {
      (service as any).channel = null;
      const handler = jest.fn();
      await expect(service.consume('test-queue', handler)).resolves.not.toThrow();
    });

    it('acks message after successful handler', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await service.consume('test-queue', handler);

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      const fakeMsg = {
        content: Buffer.from(JSON.stringify({ data: 'test' })),
        properties: { headers: {} },
      };
      await consumeCallback(fakeMsg);

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
      expect(mockChannel.ack).toHaveBeenCalledWith(fakeMsg);
    });

    it('retries message on handler failure (retryCount < 3)', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('processing failed'));
      await service.consume('test-queue', handler);

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      const fakeMsg = {
        content: Buffer.from(JSON.stringify({ data: 'test' })),
        properties: { headers: { 'x-retry-count': 1 } },
      };
      await consumeCallback(fakeMsg);

      expect(mockChannel.ack).toHaveBeenCalledWith(fakeMsg);
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('nacks message after max retries (sends to DLQ)', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('always fails'));
      await service.consume('test-queue', handler);

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      const fakeMsg = {
        content: Buffer.from(JSON.stringify({ data: 'test' })),
        properties: { headers: { 'x-retry-count': 3 } },
      };
      await consumeCallback(fakeMsg);

      expect(mockChannel.nack).toHaveBeenCalledWith(fakeMsg, false, false);
    });

    it('ignores null messages', async () => {
      const handler = jest.fn();
      await service.consume('test-queue', handler);
      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(null);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('assertQueue', () => {
    it('asserts queue with DLX when channel available', async () => {
      await service.assertQueue('my-queue');
      expect(mockChannel.assertExchange).toHaveBeenCalledWith('my-queue.dlx', 'direct', { durable: true });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('my-queue.dlq', { durable: true });
      expect(mockChannel.bindQueue).toHaveBeenCalledWith('my-queue.dlq', 'my-queue.dlx', 'my-queue');
    });

    it('does not throw when channel is null', async () => {
      (service as any).channel = null;
      await expect(service.assertQueue('my-queue')).resolves.not.toThrow();
    });
  });

  describe('bindQueue', () => {
    it('binds queue to exchange when channel available', async () => {
      await service.bindQueue('my-queue', 'my-exchange', 'routing.key');
      expect(mockChannel.assertExchange).toHaveBeenCalledWith('my-exchange', 'direct', { durable: true });
      expect(mockChannel.bindQueue).toHaveBeenCalledWith('my-queue', 'my-exchange', 'routing.key');
    });

    it('does not throw when channel is null', async () => {
      (service as any).channel = null;
      await expect(service.bindQueue('q', 'ex', 'key')).resolves.not.toThrow();
    });
  });

  describe('connection failure', () => {
    it('handles connection failure gracefully', async () => {
      mockConnect.mockRejectedValueOnce(new Error('connection refused'));
      const failService = new RabbitMQService(defaultOptions);
      await new Promise((resolve) => setImmediate(resolve));
      expect(failService.isAvailable()).toBe(false);
      (failService as any).isShuttingDown = true;
    });
  });
});
