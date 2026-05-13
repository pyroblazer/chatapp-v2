import { Injectable, Logger } from '@nestjs/common';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaHost =
    process.env.OLLAMA_HOST || 'http://localhost:11434';

  async generateResponse(
    model: string,
    messages: ChatMessage[],
    systemPrompt?: string,
  ): Promise<string> {
    const allMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch(`${this.ollamaHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: allMessages, stream: false }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  async *generateStreamingResponse(
    model: string,
    messages: ChatMessage[],
    systemPrompt?: string,
  ): AsyncGenerator<string> {
    const allMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch(`${this.ollamaHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: allMessages, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
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
