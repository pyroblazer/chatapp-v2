import { AiService } from '../ai.service';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OLLAMA_HOST = 'http://localhost:11434';
    service = new AiService();
  });

  describe('checkHealth', () => {
    it('sets available=true when Ollama responds OK', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });
      const result = await service.checkHealth();
      expect(result).toBe(true);
      expect(service.isAvailable()).toBe(true);
    });

    it('sets available=false when Ollama returns non-OK', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      const result = await service.checkHealth();
      expect(result).toBe(false);
      expect(service.isAvailable()).toBe(false);
    });

    it('sets available=false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      const result = await service.checkHealth();
      expect(result).toBe(false);
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('generateResponse', () => {
    it('returns response content when Ollama is available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: 'Hello from AI' } }),
      });
      const result = await service.generateResponse('llama3', [
        { role: 'user', content: 'Hi' },
      ]);
      expect(result).toBe('Hello from AI');
    });

    it('returns fallback message when Ollama returns non-OK', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });
      const result = await service.generateResponse('llama3', [
        { role: 'user', content: 'Hi' },
      ]);
      expect(result).toContain('unavailable');
    });

    it('returns fallback message on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fetch failed'));
      const result = await service.generateResponse('llama3', [
        { role: 'user', content: 'Hi' },
      ]);
      expect(result).toContain('unavailable');
    });

    it('prepends system prompt when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: 'OK' } }),
      });
      await service.generateResponse('llama3', [{ role: 'user', content: 'Hi' }], 'You are a helpful assistant.');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toBe('You are a helpful assistant.');
    });
  });

  describe('generateStreamingResponse', () => {
    it('yields chunks from streaming response', async () => {
      const lines = [
        JSON.stringify({ message: { content: 'Hello' } }),
        JSON.stringify({ message: { content: ' World' } }),
        '',
      ].join('\n');

      const encoder = new TextEncoder();
      const encoded = encoder.encode(lines);
      let offset = 0;
      const reader = {
        read: jest.fn().mockImplementation(() => {
          if (offset < encoded.length) {
            const chunk = encoded.slice(offset);
            offset = encoded.length;
            return Promise.resolve({ done: false, value: chunk });
          }
          return Promise.resolve({ done: true, value: undefined });
        }),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => reader },
      });

      const chunks: string[] = [];
      for await (const chunk of service.generateStreamingResponse('llama3', [{ role: 'user', content: 'Hi' }])) {
        chunks.push(chunk);
      }
      expect(chunks).toContain('Hello');
      expect(chunks).toContain(' World');
    });

    it('yields fallback message when Ollama returns non-OK', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const chunks: string[] = [];
      for await (const chunk of service.generateStreamingResponse('llama3', [])) {
        chunks.push(chunk);
      }
      expect(chunks[0]).toContain('unavailable');
    });

    it('yields fallback message on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network fail'));

      const chunks: string[] = [];
      for await (const chunk of service.generateStreamingResponse('llama3', [])) {
        chunks.push(chunk);
      }
      expect(chunks[0]).toContain('unavailable');
    });
  });

  describe('estimateTokenCount', () => {
    it('estimates ~1 token per 4 chars', () => {
      expect(service.estimateTokenCount('abcd')).toBe(1);
      expect(service.estimateTokenCount('abcdefgh')).toBe(2);
      expect(service.estimateTokenCount('abc')).toBe(1);
    });

    it('returns 0 for empty string', () => {
      expect(service.estimateTokenCount('')).toBe(0);
    });
  });

  describe('buildContext', () => {
    it('includes recent messages that fit within token limit', () => {
      const messages = [
        { role: 'user' as const, content: 'a'.repeat(400) },  // ~100 tokens
        { role: 'assistant' as const, content: 'b'.repeat(400) },  // ~100 tokens
        { role: 'user' as const, content: 'c'.repeat(400) },  // ~100 tokens
      ];
      const result = service.buildContext(messages, 250);
      expect(result.length).toBe(2);
      expect(result[result.length - 1].content).toContain('c');
    });

    it('returns all messages when they fit within limit', () => {
      const messages = [
        { role: 'user' as const, content: 'hi' },
        { role: 'assistant' as const, content: 'hello' },
      ];
      const result = service.buildContext(messages, 3072);
      expect(result).toHaveLength(2);
    });

    it('returns empty array when single message exceeds limit', () => {
      const messages = [{ role: 'user' as const, content: 'a'.repeat(4000) }];
      const result = service.buildContext(messages, 100);
      expect(result).toHaveLength(0);
    });
  });
});
