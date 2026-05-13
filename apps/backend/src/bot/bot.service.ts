import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Bot } from './entities/bot.entity';
import { BotConversation } from './entities/bot-conversation.entity';
import { AIMessage } from './entities/ai-message.entity';
import { AiService, ChatMessage } from './ai/ai.service';

export interface CreateBotParams {
  name: string;
  persona?: string;
  model?: string;
  systemPrompt?: string;
}

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    @InjectRepository(Bot)
    private readonly botRepo: Repository<Bot>,
    @InjectRepository(BotConversation)
    private readonly conversationRepo: Repository<BotConversation>,
    @InjectRepository(AIMessage)
    private readonly messageRepo: Repository<AIMessage>,
    private readonly aiService: AiService,
    private readonly events: EventEmitter2,
  ) {}

  async createBot(userId: string, params: CreateBotParams): Promise<Bot> {
    const bot = this.botRepo.create({ ...params, createdBy: userId });
    return this.botRepo.save(bot);
  }

  async getBots(): Promise<Bot[]> {
    return this.botRepo.find({ where: { active: true } });
  }

  async getBotById(id: string): Promise<Bot> {
    const bot = await this.botRepo.findOne({ where: { id } });
    if (!bot) throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    return bot;
  }

  async updateBot(id: string, userId: string, params: Partial<CreateBotParams>): Promise<Bot> {
    const bot = await this.getBotById(id);
    if (bot.createdBy !== userId) {
      throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
    }
    Object.assign(bot, params);
    return this.botRepo.save(bot);
  }

  async deleteBot(id: string, userId: string): Promise<void> {
    const bot = await this.getBotById(id);
    if (bot.createdBy !== userId) {
      throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
    }
    await this.botRepo.remove(bot);
  }

  async startConversation(userId: string, botId: string): Promise<BotConversation> {
    const bot = await this.getBotById(botId);
    const conversation = this.conversationRepo.create({ userId, botId: bot.id });
    return this.conversationRepo.save(conversation);
  }

  async sendMessage(conversationId: string, userId: string, content: string): Promise<AIMessage> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
    }

    const tokenCount = this.aiService.estimateTokenCount(content);
    const userMessage = this.messageRepo.create({
      conversationId,
      role: 'user',
      content,
      tokenCount,
    });
    await this.messageRepo.save(userMessage);

    this.generateAiResponse(conversationId, conversation.botId).catch((err) => {
      this.logger.error(`AI response generation failed: ${err.message}`);
    });

    return userMessage;
  }

  private async generateAiResponse(conversationId: string, botId: string): Promise<void> {
    const bot = await this.getBotById(botId);
    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    const chatMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const context = this.aiService.buildContext(chatMessages);
    const response = await this.aiService.generateResponse(
      bot.model,
      context,
      bot.systemPrompt || bot.persona,
    );

    const tokenCount = this.aiService.estimateTokenCount(response);
    const aiMessage = this.messageRepo.create({
      conversationId,
      role: 'assistant',
      content: response,
      tokenCount,
    });
    await this.messageRepo.save(aiMessage);

    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    this.events.emit('ai.response', {
      conversationId,
      message: aiMessage,
      userId: conversation?.userId,
    });
  }

  async getConversationMessages(conversationId: string, userId: string): Promise<AIMessage[]> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
    }
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async getUserConversations(userId: string): Promise<BotConversation[]> {
    return this.conversationRepo.find({
      where: { userId, active: true },
      order: { updatedAt: 'DESC' },
    });
  }
}
