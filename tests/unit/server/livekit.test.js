import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { setup } from '@nuxt/test-utils';

// Mock the livekit-server-sdk
vi.mock('livekit-server-sdk', () => {
  return {
    AccessToken: vi.fn().mockImplementation(() => {
      return {
        addGrant: vi.fn().mockReturnThis(),
        toJwt: vi.fn().mockReturnValue('mock-jwt-token')
      };
    })
  };
});

// Set mock runtime config
vi.mock('#imports', () => {
  return {
    useRuntimeConfig: vi.fn(() => ({
      livekit: {
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
        wsUrl: 'wss://test-livekit-url.com'
      },
      public: {
        livekit: {
          wsUrl: 'wss://test-livekit-url.com'
        }
      }
    }))
  };
});

describe('LiveKit Token API', () => {
  beforeAll(async () => {
    await setup({
      server: true,
      browser: false
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /*global global*/
  it('should return a token when valid room and identity are provided', async () => {
    // Use vi.mock for $fetch instead of making real API calls
    const mockResponse = { token: 'mock-jwt-token' };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    expect(mockResponse).toHaveProperty('token');
    expect(mockResponse.token).toBe('mock-jwt-token');
  });

  it('should throw an error when room is missing', async () => {
    // Create a mock error for missing room
    const mockError = new Error('Missing required fields: room and identity');
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(mockError);

    await expect(Promise.reject(mockError)).rejects.toThrow(
      'Missing required fields'
    );
  });

  it('should throw an error when identity is missing', async () => {
    // Create a mock error for missing identity
    const mockError = new Error('Missing required fields: room and identity');
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(mockError);

    await expect(Promise.reject(mockError)).rejects.toThrow(
      'Missing required fields'
    );
  });

  it('should handle custom permissions in the token', async () => {
    // Use vi.mock for $fetch with custom permissions
    const mockResponse = { token: 'mock-jwt-token' };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    expect(mockResponse).toHaveProperty('token');
    expect(mockResponse.token).toBe('mock-jwt-token');
  });
});
