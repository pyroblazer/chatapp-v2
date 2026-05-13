import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../utils/decorators';
import { CreateBotParams, BotService } from './bot.service';

@Controller('bots')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createBot(@AuthUser() user: { id: string }, @Body() body: CreateBotParams) {
    return this.botService.createBot(user.id, body);
  }

  @Get()
  async getBots() {
    return this.botService.getBots();
  }

  @Get(':id')
  async getBotById(@Param('id') id: string) {
    return this.botService.getBotById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateBot(
    @Param('id') id: string,
    @AuthUser() user: { id: string },
    @Body() body: Partial<CreateBotParams>,
  ) {
    return this.botService.updateBot(id, user.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteBot(@Param('id') id: string, @AuthUser() user: { id: string }) {
    await this.botService.deleteBot(id, user.id);
    return { status: 'ok' };
  }

  @Post(':id/conversations')
  @UseGuards(JwtAuthGuard)
  async startConversation(
    @Param('id') botId: string,
    @AuthUser() user: { id: string },
  ) {
    return this.botService.startConversation(user.id, botId);
  }

  @Post('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @AuthUser() user: { id: string },
    @Body() body: { content: string },
  ) {
    if (!body.content?.trim()) {
      throw new HttpException('Content is required', HttpStatus.BAD_REQUEST);
    }
    return this.botService.sendMessage(conversationId, user.id, body.content);
  }

  @Get('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @AuthUser() user: { id: string },
  ) {
    return this.botService.getConversationMessages(conversationId, user.id);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getUserConversations(@AuthUser() user: { id: string }) {
    return this.botService.getUserConversations(user.id);
  }
}
