import { Controller, Get, Post, Body } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('test/redis')
export class RedisController {
  constructor(private redisService: RedisService) {}

  @Get()
  async test() {
    try {
      await this.redisService.set('test_key', { message: 'Hello Redis', timestamp: new Date() }, 60);
      const value = await this.redisService.get('test_key');
      await this.redisService.del('test_key');
      return { success: true, value };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('set')
  async setKeyValue(@Body() body: { key: string; value: any; ttl?: number }) {
    try {
      await this.redisService.set(body.key, body.value, body.ttl);
      return { success: true, message: 'Key set successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('get')
  async getValue(@Body() body: { key: string }) {
    try {
      const value = await this.redisService.get(body.key);
      return { success: true, value };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('delete')
  async deleteKey(@Body() body: { key: string }) {
    try {
      await this.redisService.del(body.key);
      return { success: true, message: 'Key deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
