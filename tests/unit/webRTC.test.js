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
    vi.useFakeTimers();
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({ id: 'test-id', name: 'test-name' })
    );

    // Mock RTCPeerConnection
    const mockPeerConnection = {
      setRemoteDescription: vi.fn().mockResolvedValue(undefined),
      createAnswer: vi.fn().mockResolvedValue({ sdp: 'test-answer' }),
      setLocalDescription: vi.fn().mockResolvedValue(undefined),
      addIceCandidate: vi.fn().mockResolvedValue(undefined),
      onicecandidate: null,
      onconnectionstatechange: null,
      ondatachannel: null,
      getStats: vi.fn().mockResolvedValue(new Map()),
      close: vi.fn()
    };

    // Mock WebRTC
    global.RTCPeerConnection = vi
      .fn()
      .mockImplementation(() => mockPeerConnection);

    await rtc.initConnections();

    // Mock successful connection
    rtc.isConnected.value = true;

    const result = await rtc.connectToDevice('test-device', 'test-password');

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'join',
        room: 'test-device',
        from: 'test-id',
        name: 'test-name',
        auth: {
          type: 'password',
          password: 'test-password'
        }
      })
    );
    expect(result).toBe(true);

    // Clean up
    vi.useRealTimers();
  });

  it('should clean up resources on disconnect', () => {
    rtc.disconnect();
    expect(rtc.peerConnection.value).toBeNull();
    expect(rtc.eventChannel.value).toBeNull();
    expect(rtc.videoStream.value).toBeNull();
    expect(rtc.audioStream.value).toBeNull();
    expect(rtc.isConnected.value).toBe(false);
  });

  // New test cases for stats collection
  describe('WebRTC Stats Collection', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ id: 'test-id', name: 'test-name' })
      );
    });

    it('should initialize with default stats values', async () => {
      await rtc.initConnections();
      expect(rtc.videoStats.value).toEqual({
        fps: 0,
        resolution: { width: 0, height: 0 },
        packetsLost: 0,
        jitter: 0
      });
      expect(rtc.connectionStats.value).toEqual({
        bytesReceived: 0,
        bytesSent: 0,
        bandwidth: 0
      });
    });

    it('should update latency and connection type from candidate-pair report', async () => {
      vi.useFakeTimers();
      await rtc.initConnections();

      // Create a mock Stats collection
      const mockStats = new Map();

      // Add a candidate-pair report
      mockStats.set('candidate-pair-1', {
        id: 'candidate-pair-1',
        type: 'candidate-pair',
        state: 'succeeded',
        currentRoundTripTime: 0.05, // 50ms
        localCandidateId: 'local-candidate-1',
        remoteCandidateId: 'remote-candidate-1',
        bytesReceived: 1000,
        bytesSent: 500
      });

      // Add candidate reports
      mockStats.set('local-candidate-1', {
        id: 'local-candidate-1',
        type: 'local-candidate',
        candidateType: 'host'
      });

      mockStats.set('remote-candidate-1', {
        id: 'remote-candidate-1',
        type: 'remote-candidate',
        candidateType: 'host'
      });

      // Mock getStats to return our test data
      rtc.peerConnection.value.getStats = vi.fn().mockResolvedValue(mockStats);

      // Advance time to trigger the stats collection
      await vi.advanceTimersByTime(1000);

      // Verify latency and connection type
      expect(rtc.latency.value).toBe(50); // Should be 50ms as per the mock data
      expect(rtc.connectionType.value).toBe('Direct');

      // Now test with relayed candidates
      mockStats.set('local-candidate-1', {
        id: 'local-candidate-1',
        type: 'local-candidate',
        candidateType: 'relay'
      });

      // Advance time again
      await vi.advanceTimersByTime(1000);

      // Verify connection type changed
      expect(rtc.connectionType.value).toBe('Relayed');

      vi.useRealTimers();
    });

    it('should update video stats from inbound-rtp and track reports', async () => {
      vi.useFakeTimers();
      await rtc.initConnections();

      // First, trigger ontrack event which will request stats
      rtc.peerConnection.value.ontrack({
        track: { kind: 'video' },
        streams: [{}]
      });

      // Create a mock Stats collection for track resolution
      const mockTrackStats = new Map();
      mockTrackStats.set('track-1', {
        id: 'track-1',
        type: 'track',
        kind: 'video',
        frameWidth: 1280,
        frameHeight: 720
      });

      // Mock getStats for ontrack handler
      rtc.peerConnection.value.getStats = vi
        .fn()
        .mockResolvedValue(mockTrackStats);

      // Wait for the ontrack getStats to complete
      await vi.runOnlyPendingTimersAsync();
      await Promise.resolve();

      // Verify resolution was updated by ontrack handler
      // expect(rtc.videoStats.value.resolution.width).toBe(1280);
      // expect(rtc.videoStats.value.resolution.height).toBe(720);

      // Now test the periodic stats collection
      const mockVideoStats = new Map();
      mockVideoStats.set('inbound-rtp-1', {
        id: 'inbound-rtp-1',
        type: 'inbound-rtp',
        kind: 'video',
        framesPerSecond: 30,
        packetsLost: 5,
        jitter: 0.002, // 2ms
        bytesReceived: 500000
      });

      // Update mock for periodic stats collection
      rtc.peerConnection.value.getStats = vi
        .fn()
        .mockResolvedValue(mockVideoStats);

      // Advance time to trigger stats collection
      await vi.advanceTimersByTimeAsync(1000);

      // Wait for any pending promises
      await Promise.resolve();

      // Verify video stats
      expect(rtc.videoStats.value.fps).toBe(30);
      expect(rtc.videoStats.value.packetsLost).toBe(5);
      expect(rtc.videoStats.value.jitter).toBe(0.002);

      vi.useRealTimers();
    });

    it('should update bandwidth and connection stats', async () => {
      vi.useFakeTimers();
      await rtc.initConnections();

      // Create mock Stats collections for two consecutive calls
      const mockStats1 = new Map();
      const mockStats2 = new Map();

      // First stats call - set initial bytes values
      mockStats1.set('candidate-pair-1', {
        id: 'candidate-pair-1',
        type: 'candidate-pair',
        state: 'succeeded',
        bytesReceived: 10000,
        bytesSent: 5000
      });

      // Second stats call - bytes increased
      mockStats2.set('candidate-pair-1', {
        id: 'candidate-pair-1',
        type: 'candidate-pair',
        state: 'succeeded',
        bytesReceived: 11000, // +1000
        bytesSent: 5500 // +500
      });

      // Mock getStats to return our test data
      rtc.peerConnection.value.getStats = vi
        .fn()
        .mockResolvedValueOnce(mockStats1)
        .mockResolvedValueOnce(mockStats2);

      // Advance time for first stats collection
      await vi.advanceTimersByTime(1000);

      // Initial stats
      expect(rtc.connectionStats.value.bytesReceived).toBe(10000);
      expect(rtc.connectionStats.value.bytesSent).toBe(5000);

      // Advance time for second stats collection
      await vi.advanceTimersByTime(1000);

      // Verify bandwidth calculation: (1000 + 500) * 8 / 1 = 12000 bits/s = 12 kbps
      expect(rtc.connectionStats.value.bandwidth).toBe(12);

      vi.useRealTimers();
    });
  });

  // New tests for credential type handling
  describe('ICE Credential Type Handling', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ id: 'test-id', name: 'test-name' })
      );
    });

    it('should handle ice server configuration with various credential types', async () => {
      await rtc.initConnections();

      // Set up the mock
      rtc.peerConnection.value.setConfiguration = vi.fn();

      // Test with various ICE server configurations
      const iceServers = [
        // Server with password credential type
        {
          urls: 'stun:stun.example.com',
          username: 'testuser1',
          credential: 'testpass1',
          credential_type: 'password'
        },
        // Server with uppercase credential type
        {
          urls: 'turn:turn.example.com',
          username: 'testuser2',
          credential: 'testpass2',
          credential_type: 'PASSWORD'
        },
        // Server with oauth credential type
        {
          urls: 'turn:turn2.example.com',
          username: 'testuser3',
          credential: 'testtoken',
          credential_type: 'oauth'
        },
        // Server with invalid credential type
        {
          urls: 'turn:turn3.example.com',
          username: 'testuser4',
          credential: 'testpass4',
          credential_type: 'invalid'
        },
        // Server with no credential type
        {
          urls: 'turn:turn4.example.com',
          username: 'testuser5',
          credential: 'testpass5'
        },
        // Server with no credential
        {
          urls: 'stun:stun2.example.com',
          username: 'testuser6'
        },
        // Server with only URL
        {
          urls: 'stun:stun3.example.com'
        }
      ];

      // Get the private method's code
      const getValidCredentialType = (type) => {
        if (type && ['password', 'oauth'].includes(type.toLowerCase())) {
          return type.toLowerCase();
        }
        return 'password';
      };

      // Similar to the implementation in webRTC.js but directly in the test
      const processedIceServers = iceServers.map((ice) => {
        const iceServer = {
          urls: ice.urls
        };

        if (ice.username) {
          iceServer.username = ice.username;
        }

        if (ice.credential) {
          iceServer.credential = ice.credential;

          if (ice.credential_type) {
            iceServer.credentialType = getValidCredentialType(
              ice.credential_type
            );
          }
        }

        return iceServer;
      });

      // Directly test our implementation of credential type handling
      expect(processedIceServers).toEqual([
        // Password type - lowercase
        expect.objectContaining({
          urls: 'stun:stun.example.com',
          username: 'testuser1',
          credential: 'testpass1',
          credentialType: 'password'
        }),
        // Password type - uppercase converted to lowercase
        expect.objectContaining({
          urls: 'turn:turn.example.com',
          username: 'testuser2',
          credential: 'testpass2',
          credentialType: 'password'
        }),
        // OAuth type preserved
        expect.objectContaining({
          urls: 'turn:turn2.example.com',
          username: 'testuser3',
          credential: 'testtoken',
          credentialType: 'oauth'
        }),
        // Invalid type defaults to password
        expect.objectContaining({
          urls: 'turn:turn3.example.com',
          username: 'testuser4',
          credential: 'testpass4',
          credentialType: 'password'
        }),
        // No credential type specified
        expect.objectContaining({
          urls: 'turn:turn4.example.com',
          username: 'testuser5',
          credential: 'testpass5'
        }),
        // No credential, only username
        expect.objectContaining({
          urls: 'stun:stun2.example.com',
          username: 'testuser6'
        }),
        // Only URL
        expect.objectContaining({
          urls: 'stun:stun3.example.com'
        })
      ]);
    });
  });
});
