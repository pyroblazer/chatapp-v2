import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture interceptors registered during module initialization
let capturedRequestInterceptors: Array<(config: any) => any> = [];
let capturedResponseRejectInterceptors: Array<(error: any) => any> = [];

vi.mock('axios', () => {
  capturedRequestInterceptors = [];
  capturedResponseRejectInterceptors = [];

  const mockClient = {
    interceptors: {
      request: {
        use: vi.fn((onFulfilled: any) => {
          capturedRequestInterceptors.push(onFulfilled);
        }),
      },
      response: {
        use: vi.fn((_onFulfilled: any, onRejected?: any) => {
          if (onRejected) capturedResponseRejectInterceptors.push(onRejected);
        }),
      },
    },
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  };

  return {
    default: {
      create: vi.fn(() => mockClient),
    },
  };
});

describe('api module', () => {
  beforeEach(() => {
    vi.resetModules();
    capturedRequestInterceptors = [];
    capturedResponseRejectInterceptors = [];
  });

  it('should create axios client with withCredentials: true and empty baseURL', async () => {
    const axios = (await import('axios')).default;
    await import('../api');
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ withCredentials: true, baseURL: '' })
    );
  });

  describe('access token', () => {
    it('should roundtrip setAccessToken and getAccessToken', async () => {
      const { setAccessToken, getAccessToken } = await import('../api');
      setAccessToken('test-token');
      expect(getAccessToken()).toBe('test-token');
      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('request interceptor', () => {
    it('should add Authorization header when token is set', async () => {
      const { setAccessToken } = await import('../api');
      setAccessToken('my-jwt-token');

      const requestInterceptor = capturedRequestInterceptors[0];
      expect(requestInterceptor).toBeDefined();

      const config = { headers: {} as Record<string, string> };
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
    });

    it('should not add Authorization header when token is null', async () => {
      const { setAccessToken } = await import('../api');
      setAccessToken(null);

      const requestInterceptor = capturedRequestInterceptors[0];
      expect(requestInterceptor).toBeDefined();

      const config = { headers: {} as Record<string, string> };
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('should redirect to /login on 401 when refresh also fails', async () => {
      const { setAccessToken } = await import('../api');
      setAccessToken('old-token');

      const rejectInterceptor = capturedResponseRejectInterceptors[0];
      expect(rejectInterceptor).toBeDefined();

      const error = {
        response: { status: 401 },
        config: { _retry: false, headers: {} },
      };

      // Mock window.location
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { href: '' };

      try {
        await expect(rejectInterceptor(error)).rejects.toEqual(error);
        expect(window.location.href).toBe('/login');
      } finally {
        (window as any).location = originalLocation;
      }
    });

    it('should pass through non-401 errors', async () => {
      await import('../api');

      const rejectInterceptor = capturedResponseRejectInterceptors[0];
      expect(rejectInterceptor).toBeDefined();

      const error = {
        response: { status: 500 },
        config: { _retry: false },
      };

      await expect(rejectInterceptor(error)).rejects.toEqual(error);
    });
  });
});
