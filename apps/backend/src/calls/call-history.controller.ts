import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import { CallHistoryService } from './call-history.service';

@ApiTags('Calls')
@ApiBearerAuth()
@SkipThrottle()
@Controller('calls')
export class CallHistoryController {
  constructor(private readonly callHistoryService: CallHistoryService) {}

  @ApiOperation({ summary: 'Get call history for the authenticated user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200 })
  @Get('history')
  async getCallHistory(
    @AuthUser() { id }: User,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    const [calls, total] = await this.callHistoryService.getCallHistory(
      id,
      limit || 50,
      offset || 0,
    );
    return { data: calls, total };
  }
}
