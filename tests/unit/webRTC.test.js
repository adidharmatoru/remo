import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webRTC } from '../../composables/networks/webRTC';

describe('webRTC', () => {
  let rtc;
  const mockWebsocket = { value: {} };
  const mockSendMessage = vi.fn();
  const mockIsOnline = { value: true };
  const mockWaitForConnection = vi.fn();
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    /*global global*/
    global.localStorage = mockLocalStorage;
    rtc = webRTC(
      mockWebsocket,
      mockSendMessage,
      mockIsOnline,
      mockWaitForConnection
    );
  });

  it('should initialize with default values', () => {
    expect(rtc.peerConnection.value).toBeNull();
    expect(rtc.videoStream.value).toBeNull();
    expect(rtc.audioStream.value).toBeNull();
    expect(rtc.isConnected.value).toBe(false);
    expect(rtc.latency.value).toBe(0);
  });

  it('should handle failed initialization when no user data exists', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const result = await rtc.initConnections();
    expect(result).toBe(false);
  });

  it('should handle successful initialization', async () => {
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({ id: 'test-id', name: 'test-name' })
    );
    const result = await rtc.initConnections();
    expect(result).toBe(true);

    expect(rtc.uuid.value).toBe('test-id');
  });

  it('should handle data channel setup', async () => {
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({ id: 'test-id', name: 'test-name' })
    );
    await rtc.initConnections();

    const mockDataChannel = {
      onopen: null,
      onclose: null
    };

    rtc.peerConnection.value.ondatachannel({ channel: mockDataChannel });
    mockDataChannel.onopen();
    expect(rtc.eventChannel.value).toBeTruthy();

    mockDataChannel.onclose();
    expect(rtc.eventChannel.value).toBeNull();
  });

  //   it('should handle ICE candidate processing', async () => {
  //     mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ id: 'test-id', name: 'test-name' }));
  //     await rtc.initConnections();
  //     const mockCandidate = { candidate: 'test' };

  //     // Test queuing when remote description is not set
  //     await rtc.handleIceCandidate(mockCandidate);
  //     expect(rtc.iceCandidatesQueue.value).toHaveLength(1);

  //     // Test processing when remote description is set
  //     rtc.peerConnection.value.remoteDescription = {};
  //     await rtc.handleIceCandidate(mockCandidate);
  //     expect(rtc.peerConnection.value.addIceCandidate).toHaveBeenCalledWith(
  //       expect.objectContaining({ candidate: 'test' })
  //     );
  //   });

  //   it('should handle video freeze detection', async () => {
  //     vi.useFakeTimers();
  //     mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ id: 'test-id', name: 'test-name' }));
  //     await rtc.initConnections();

  //     const mockStats = new Map([
  //       ['video', { kind: 'video', framesPerSecond: 0 }]
  //     ]);

  //     rtc.peerConnection.value.getStats = vi.fn().mockResolvedValue(mockStats);

  //     // Trigger freeze detection
  //     await vi.advanceTimersByTime(1000);
  //     expect(rtc.videoFrozen.value).toBe(true);

  //     // Test recovery
  //     mockStats.set('video', { kind: 'video', framesPerSecond: 30 });
  //     await vi.advanceTimersByTime(1000);
  //     expect(rtc.videoFrozen.value).toBe(false);

  //     vi.useRealTimers();
  //   });

  //   it('should handle latency updates', async () => {
  //     vi.useFakeTimers();
  //     mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ id: 'test-id', name: 'test-name' }));
  //     await rtc.initConnections();

  //     const mockStats = new Map([
  //       ['candidate-pair', { type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.05 }]
  //     ]);

  //     rtc.peerConnection.value.getStats = vi.fn().mockResolvedValue(mockStats);

  //     await vi.advanceTimersByTime(1000);
  //     expect(rtc.latency.value).toBe(50); // 0.05 * 1000

  //     vi.useRealTimers();
  //   });

  it('should handle server messages', async () => {
    await rtc.initConnections();

    const mockOffer = {
      type: 'offer',
      sdp: 'test',
      ice_servers: [
        {
          urls: 'test',
          username: 'test',
          credential: 'test',
          credential_type: 'PASSWORD'
        }
      ],
      uuid: 'other-id'
    };

    await rtc.handleServerMessage(mockOffer);
    // expect(rtc.peerConnection.value.setRemoteDescription).toHaveBeenCalled();
    // expect(rtc.peerConnection.value.createAnswer).toHaveBeenCalled();
  });

  it('should handle connection to device', async () => {
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({ id: 'test-id', name: 'test-name' })
    );
    await rtc.initConnections();
    await rtc.connectToDevice('test-device', 'test-password');

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'join',
      room: 'test-device',
      from: 'test-id',
      name: 'test-name',
      auth: {
        type: 'password',
        password: 'test-password'
      }
    });
  });

  it('should clean up resources on disconnect', () => {
    rtc.disconnect();
    expect(rtc.peerConnection.value).toBeNull();
    expect(rtc.eventChannel.value).toBeNull();
    expect(rtc.videoStream.value).toBeNull();
    expect(rtc.audioStream.value).toBeNull();
    expect(rtc.isConnected.value).toBe(false);
  });
});
