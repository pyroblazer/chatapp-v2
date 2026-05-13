import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bot } from './entities/bot.entity';
import { BotConversation } from './entities/bot-conversation.entity';
import { AIMessage } from './entities/ai-message.entity';
import { AiService } from './ai/ai.service';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bot, BotConversation, AIMessage])],
  controllers: [BotController],
  providers: [AiService, BotService],
  exports: [BotService],
})
export class BotModule {}
