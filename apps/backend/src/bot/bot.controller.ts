import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from '../utils/decorators';
import type { CreateBotParams } from './bot.service';
import { BotService } from './bot.service';
import { SendBotMessageDto } from './dtos/SendBotMessage.dto';

@ApiTags('Bots')
@ApiBearerAuth()
@Controller('bots')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bot' })
  async createBot(
    @AuthUser() user: { id: string },
    @Body() body: CreateBotParams,
  ) {
    return this.botService.createBot(user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'List all bots' })
  async getBots() {
    return this.botService.getBots();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bot by ID' })
  @ApiParam({ name: 'id' })
  async getBotById(@Param('id') id: string) {
    return this.botService.getBotById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bot' })
  @ApiParam({ name: 'id' })
  async updateBot(
    @Param('id') id: string,
    @AuthUser() user: { id: string },
    @Body() body: Partial<CreateBotParams>,
  ) {
    return this.botService.updateBot(id, user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bot' })
  @ApiParam({ name: 'id' })
  async deleteBot(@Param('id') id: string, @AuthUser() user: { id: string }) {
    await this.botService.deleteBot(id, user.id);
    return { success: true };
  }

  @Post(':id/conversations')
  @ApiOperation({ summary: 'Start a conversation with a bot' })
  @ApiParam({ name: 'id', description: 'Bot UUID' })
  async startConversation(
    @Param('id') botId: string,
    @AuthUser() user: { id: string },
  ) {
    return this.botService.startConversation(user.id, botId);
  }

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message to a bot' })
  @ApiParam({ name: 'conversationId' })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @AuthUser() user: { id: string },
    @Body() body: SendBotMessageDto,
  ) {
    if (!body.content?.trim()) {
      throw new HttpException('Content is required', HttpStatus.BAD_REQUEST);
    }
    return this.botService.sendMessage(conversationId, user.id, body.content);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages in a bot conversation' })
  @ApiParam({ name: 'conversationId' })
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @AuthUser() user: { id: string },
  ) {
    return this.botService.getConversationMessages(conversationId, user.id);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all bot conversations for the user' })
  async getUserConversations(@AuthUser() user: { id: string }) {
    return this.botService.getUserConversations(user.id);
  }
}
