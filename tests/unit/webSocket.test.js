import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webSocket } from '../../composables/networks/webSocket';

describe('webSocket', () => {
  let ws;
  let mockWebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: WebSocket.OPEN
    };

    /*global global*/
    global.WebSocket = vi.fn(() => mockWebSocket);
    ws = webSocket(false);
  });

  /*global afterEach*/
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle sending messages when socket is closed', () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    mockWebSocket.readyState = WebSocket.CLOSED;

    ws.sendMessage({ type: 'test' });
    expect(consoleSpy).toHaveBeenCalledWith(
      'WebSocket is not connected. Message not sent.'
    );
  });
});
