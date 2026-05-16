import { IoAdapter } from '@nestjs/platform-socket.io';
import type { AuthenticatedSocket } from '../utils/interfaces';
import * as jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

export class WebsocketAdapter extends IoAdapter {
  private readonly logger = new Logger(WebsocketAdapter.name);

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options);

    // Set up Redis adapter for multi-instance WebSocket scaling
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    try {
      const pubClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
      });
      const subClient = pubClient.duplicate();

      server.adapter(createAdapter(pubClient, subClient));
      this.logger.log('Redis adapter applied to WebSocket server');
    } catch (err) {
      this.logger.warn(
        'Failed to apply Redis adapter, falling back to in-memory. Multi-instance scaling will not work.',
        err,
      );
    }

    server.use(
      async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Not Authenticated. No token provided'));
        }

        try {
          const jwtSecret = process.env.JWT_SECRET;
          if (!jwtSecret)
            throw new Error('JWT_SECRET environment variable is required');
          const payload = jwt.verify(token, jwtSecret) as {
            sub: string;
            username: string;
          };
          socket.user = { id: payload.sub, username: payload.username } as any;
          next();
        } catch {
          return next(new Error('Invalid or expired token'));
        }
      },
    );
    return server;
  }
}
