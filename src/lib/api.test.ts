import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchApi } from './api';

describe('fetchApi', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset mocks
    global.fetch = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should automatically append X-Pin-Auth header if PIN exists in localStorage', async () => {
    localStorage.setItem('r1_web_pin', '123456');

    // Mock fetch response
    const mockResponse = {
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await fetchApi('/api/config');

    // Assert fetch was called with the correct header
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const mockCall = (global.fetch as any).mock.calls[0];
    const requestConfig = mockCall[1];
    
    expect(requestConfig.headers.get('x-pin-auth')).toBe('123456');
  });

  it('should throw an error with status 401 when response is Unauthorized', async () => {
    // Mock 401 Unauthorized response
    const mockResponse = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Invalid PIN' })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    try {
      await fetchApi('/api/config');
      // Should not reach here
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.status).toBe(401);
      expect(err.message).toBe('Invalid PIN');
    }
  });

  it('should include application/json header when data is provided', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ updated: true })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await fetchApi('/api/config', {
      method: 'POST',
      data: { isWebAuthEnabled: true }
    });

    const mockCall = (global.fetch as any).mock.calls[0];
    const requestConfig = mockCall[1];
    
    expect(requestConfig.headers.get('Content-Type')).toBe('application/json');
    expect(requestConfig.body).toBe(JSON.stringify({ isWebAuthEnabled: true }));
  });
});
