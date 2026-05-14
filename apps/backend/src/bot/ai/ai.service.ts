import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const AI_UNAVAILABLE_MESSAGE =
  "I'm sorry, the AI service is currently unavailable. Please try again later.";

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaHost =
    process.env.OLLAMA_HOST || 'http://localhost:11434';
  private available = false;

  async onModuleInit(): Promise<void> {
    try {
      await this.checkHealth();
      if (this.available) {
        this.logger.log('Ollama AI service is available');
      }
    } catch {
      this.logger.warn(
        'Ollama AI service is unavailable — bot will return fallback messages',
      );
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaHost}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      this.available = response.ok;
      return this.available;
    } catch {
      this.available = false;
      return false;
    }
  }

  async generateResponse(
    model: string,
    messages: ChatMessage[],
    systemPrompt?: string,
  ): Promise<string> {
    const allMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    try {
      const response = await fetch(`${this.ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: allMessages, stream: false }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        this.logger.warn(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
        return AI_UNAVAILABLE_MESSAGE;
      }

      const data = await response.json();
      this.available = true;
      return data.message?.content || '';
    } catch (error) {
      this.available = false;
      this.logger.warn(`Ollama request failed: ${error.message}`);
      return AI_UNAVAILABLE_MESSAGE;
    }
  }

  async *generateStreamingResponse(
    model: string,
    messages: ChatMessage[],
    systemPrompt?: string,
  ): AsyncGenerator<string> {
    const allMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    try {
      const response = await fetch(`${this.ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: allMessages, stream: true }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        this.logger.warn(`Ollama API error: ${response.status}`);
        yield AI_UNAVAILABLE_MESSAGE;
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              yield parsed.message.content;
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      this.available = true;
    } catch (error) {
      this.available = false;
      this.logger.warn(`Ollama streaming request failed: ${error.message}`);
      yield AI_UNAVAILABLE_MESSAGE;
    }
  }

  estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  buildContext(messages: ChatMessage[], maxTokens = 3072): ChatMessage[] {
    let totalTokens = 0;
    const result: ChatMessage[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const tokens = this.estimateTokenCount(messages[i].content);
      if (totalTokens + tokens > maxTokens) break;
      result.unshift(messages[i]);
      totalTokens += tokens;
    }

    return result;
  }
}
