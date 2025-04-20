import { ref, onUnmounted, watch } from 'vue';

export function webRTC(websocket, sendMessage, isOnline, waitForConnection) {
  // Connection state
  const connectionState = {
    peerConnection: ref(null),
    eventChannel: ref(null),
    videoStream: ref(null),
    audioStream: ref(null),
    isConnected: ref(false),
    isReconnecting: ref(false),
    latency: ref(0),
    connectionType: ref('Unknown'),
    reconnectionStatus: ref(''),
    iceCandidateQueue: [],
    receivedTracks: { video: false, audio: false }
  };

  // Authentication state
  const authState = {
    deviceId: ref(null),
    password: ref(''),
    clientId: ref(null),
    clientName: ref(null)
  };

  // Connection stats
  const stats = {
    video: ref({
      fps: 0,
      resolution: { width: 0, height: 0 },
      packetsLost: 0,
      jitter: 0
    }),
    connection: ref({
      bytesReceived: 0,
      bytesSent: 0,
      bandwidth: 0
    })
  };

  // Connection control flags
  let isAttemptingConnection = false;
  let shouldPersistConnection = false;

  // Timers and intervals
  const timers = {
    connectionAttempt: null,
    latencyUpdate: null,
    networkRetry: null
  };

  // Stats tracking
  let lastStats = {
    bytesReceived: 0,
    bytesSent: 0,
    bandwidthUpdateTime: 0
  };

  // Watch for network state changes to handle reconnection
  watch(isOnline, async (newIsOnline) => {
    if (
      newIsOnline &&
      shouldPersistConnection &&
      !connectionState.isConnected.value
    ) {
      clearNetworkRetryTimer();
      resetConnectionState();

      if (authState.deviceId.value && authState.password.value) {
        connectionState.reconnectionStatus.value =
          'Network connection restored, reconnecting...';
        await connectToDevice(
          authState.deviceId.value,
          authState.password.value
        );
      }
    } else if (!newIsOnline && shouldPersistConnection) {
      connectionState.reconnectionStatus.value =
        'Network connection lost, waiting for network...';
      cleanup();
    }
  });

  /**
   * Clean up all connection resources and timers
   */
  const cleanup = () => {
    // Clear all timers
    clearAllTimers();

    // Close and cleanup WebRTC connection
    closeRTCConnection();

    // Reset all streams
    stopMediaStreams();

    // Reset connection state
    resetConnectionState();

    // Reset stats
    resetStats();
  };

  /**
   * Reset all stats to default values
   */
  const resetStats = () => {
    connectionState.latency.value = 0;
    connectionState.connectionType.value = 'Unknown';
    stats.video.value = {
      fps: 0,
      resolution: { width: 0, height: 0 },
      packetsLost: 0,
      jitter: 0
    };
    stats.connection.value = {
      bytesReceived: 0,
      bytesSent: 0,
      bandwidth: 0
    };
    lastStats = {
      bytesReceived: 0,
      bytesSent: 0,
      bandwidthUpdateTime: 0
    };
  };

  /**
   * Clear all active timers
   */
  const clearAllTimers = () => {
    Object.keys(timers).forEach((key) => {
      if (timers[key]) {
        clearTimeout(timers[key]);
        timers[key] = null;
      }
    });
  };

  /**
   * Clear the network retry timer specifically
   */
  const clearNetworkRetryTimer = () => {
    if (timers.networkRetry) {
      clearTimeout(timers.networkRetry);
      timers.networkRetry = null;
    }
  };

  /**
   * Close the RTC connection and data channels
   */
  const closeRTCConnection = () => {
    if (connectionState.peerConnection.value) {
      try {
        // Close all tracks
        const senders = connectionState.peerConnection.value.getSenders();
        senders.forEach((sender) => {
          if (sender.track) {
            sender.track.stop();
          }
        });

        // Close data channels
        if (connectionState.eventChannel.value) {
          connectionState.eventChannel.value.close();
        }

        connectionState.peerConnection.value.close();
      } catch {
        // Ignore any errors during cleanup
      }
      connectionState.peerConnection.value = null;
    }
  };

  /**
   * Stop all media streams
   */
  const stopMediaStreams = () => {
    // Stop video stream
    if (connectionState.videoStream.value) {
      try {
        connectionState.videoStream.value
          .getTracks()
          .forEach((track) => track.stop());
      } catch {
        // Ignore stream cleanup errors
      }
      connectionState.videoStream.value = null;
    }

    // Stop audio stream
    if (connectionState.audioStream.value) {
      try {
        connectionState.audioStream.value
          .getTracks()
          .forEach((track) => track.stop());
      } catch {
        // Ignore stream cleanup errors
      }
      connectionState.audioStream.value = null;
    }
  };

  /**
   * Reset connection state to defaults
   */
  const resetConnectionState = () => {
    connectionState.eventChannel.value = null;
    connectionState.isConnected.value = false;
    connectionState.iceCandidateQueue = [];
    connectionState.receivedTracks = { video: false, audio: false };
    isAttemptingConnection = false;
  };

  /**
   * Initialize WebRTC connection
   * @returns {boolean} Success status
   */
  const initConnections = async () => {
    cleanup();

    // Generate client ID from user data
    // const timestamp = Date.now();
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id) {
      return false;
    }

    // authState.clientId.value = `${userData.id}_${timestamp}`;
    authState.clientId.value = userData.id;
    authState.clientName.value = userData.name;

    // Create peer connection with empty ICE servers (will be updated later)
    connectionState.peerConnection.value = new RTCPeerConnection({
      iceServers: []
    });

    // Set up event handlers
    setupPeerConnectionEvents();
    setupDataChannelHandler();
    startConnectionMetricsMonitoring();

    return true;
  };

  /**
   * Set up event handlers for the peer connection
   */
  const setupPeerConnectionEvents = () => {
    const pc = connectionState.peerConnection.value;

    // Handle incoming tracks (video and audio)
    pc.ontrack = (event) => {
      if (event.track.kind === 'video') {
        connectionState.videoStream.value = event.streams[0];
        connectionState.receivedTracks.video = true;
        updateVideoResolution();
      } else if (event.track.kind === 'audio') {
        connectionState.audioStream.value = event.streams[0];
        connectionState.receivedTracks.audio = true;
      }
      checkAndSendReadyState();
    };

    // Handle and forward ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && authState.deviceId.value) {
        try {
          sendMessage({
            type: 'ice',
            ice: event.candidate,
            from: authState.clientId.value,
            to: authState.deviceId.value
          });
        } catch {
          // Ignore ice candidate send errors
        }
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc?.connectionState;

      if (state === 'connected') {
        connectionState.isConnected.value = true;
        connectionState.isReconnecting.value = false;
        connectionState.reconnectionStatus.value =
          'Connection established successfully';
        isAttemptingConnection = false;
        clearNetworkRetryTimer();
        checkAndSendReadyState();
      } else if (
        (state === 'disconnected' || state === 'failed') &&
        shouldPersistConnection
      ) {
        handleDisconnection();
      }
    };
  };

  /**
   * Update video resolution from stats
   */
  const updateVideoResolution = () => {
    const pc = connectionState.peerConnection.value;
    if (pc?.getStats) {
      pc.getStats()
        .then((statsReport) => {
          statsReport.forEach((report) => {
            if (report.type === 'track' && report.kind === 'video') {
              stats.video.value.resolution = {
                width: report.frameWidth || 0,
                height: report.frameHeight || 0
              };
            }
          });
        })
        .catch(() => {
          // Ignore stats collection errors
        });
    }
  };

  /**
   * Set up the data channel handler for communication
   */
  const setupDataChannelHandler = () => {
    if (connectionState.peerConnection.value) {
      connectionState.peerConnection.value.ondatachannel = (event) => {
        const dataChannel = event.channel;

        dataChannel.onopen = () => {
          connectionState.eventChannel.value = dataChannel;
          checkAndSendReadyState();
        };

        dataChannel.onclose = () => {
          connectionState.eventChannel.value = null;
        };
      };
    }
  };

  /**
   * Start monitoring connection metrics (latency, bandwidth, etc.)
   */
  const startConnectionMetricsMonitoring = () => {
    // Clear any existing interval first
    if (timers.latencyUpdate) {
      clearInterval(timers.latencyUpdate);
      timers.latencyUpdate = null;
    }

    // Start new monitoring interval
    timers.latencyUpdate = setInterval(() => {
      updateConnectionMetrics();
    }, 1000);
  };

  /**
   * Update connection metrics from WebRTC stats
   */
  const updateConnectionMetrics = () => {
    const pc = connectionState.peerConnection.value;
    if (!pc || !pc.getStats) return;

    pc.getStats()
      .then((statsReport) => {
        statsReport.forEach((report) => {
          // Update latency and connection type
          if (
            report.type === 'candidate-pair' &&
            (report.state === 'succeeded' || report.selected)
          ) {
            updateLatencyAndConnectionType(report, statsReport);
            updateBandwidthStats(report);
          }

          // Update video stats
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            updateVideoStats(report);
          }
        });
      })
      .catch(() => {
        // Ignore stats errors
      });
  };

  /**
   * Update latency and connection type from stats
   */
  const updateLatencyAndConnectionType = (report, statsReport) => {
    // Update latency
    connectionState.latency.value =
      (report.currentRoundTripTime || report.roundTripTime || 0) * 1000;

    // Find the local and remote candidate reports
    const localCandidateId = report.localCandidateId;
    const remoteCandidateId = report.remoteCandidateId;

    let localCandidateType = '';
    let remoteCandidateType = '';

    // Look for the candidate types
    statsReport.forEach((stat) => {
      if (stat.type === 'local-candidate' && stat.id === localCandidateId) {
        localCandidateType = stat.candidateType;
      }
      if (stat.type === 'remote-candidate' && stat.id === remoteCandidateId) {
        remoteCandidateType = stat.candidateType;
      }
    });

    // Determine connection type based on candidate types
    if (localCandidateType === 'relay' || remoteCandidateType === 'relay') {
      connectionState.connectionType.value = 'Relayed';
    } else {
      connectionState.connectionType.value = 'Direct';
    }
  };

  /**
   * Update bandwidth stats
   */
  const updateBandwidthStats = (report) => {
    const now = Date.now();
    const timeDiff = (now - lastStats.bandwidthUpdateTime) / 1000; // in seconds

    if (timeDiff >= 1) {
      const bytesReceivedDiff = report.bytesReceived - lastStats.bytesReceived;
      const bytesSentDiff = report.bytesSent - lastStats.bytesSent;

      stats.connection.value = {
        bytesReceived: report.bytesReceived,
        bytesSent: report.bytesSent,
        bandwidth: ((bytesReceivedDiff + bytesSentDiff) * 8) / timeDiff / 1000 // in kbps
      };

      lastStats.bytesReceived = report.bytesReceived;
      lastStats.bytesSent = report.bytesSent;
      lastStats.bandwidthUpdateTime = now;
    }
  };

  /**
   * Update video statistics from WebRTC stats
   */
  const updateVideoStats = (report) => {
    stats.video.value.fps = report.framesPerSecond || 0;
    stats.video.value.packetsLost = report.packetsLost || 0;
    stats.video.value.jitter = report.jitter || 0;

    if (report.frameWidth && report.frameHeight) {
      stats.video.value.resolution = {
        width: report.frameWidth,
        height: report.frameHeight
      };
    }
  };

  /**
   * Check if connection is ready and send ready state
   */
  const checkAndSendReadyState = () => {
    if (
      connectionState.isConnected.value &&
      connectionState.eventChannel.value
    ) {
      try {
        connectionState.reconnectionStatus.value =
          'Waiting for video stream...';
        connectionState.eventChannel.value.send('ready_state');
      } catch {
        //
      }
    }
  };

  /**
   * Connect to a remote device
   * @param {string} deviceId - ID of the device to connect to
   * @param {string} password - Password for authentication
   * @returns {Promise<boolean>} Success status
   */
  const connectToDevice = async (deviceId, password) => {
    // Don't attempt connection if we're offline
    if (!isOnline.value) {
      connectionState.reconnectionStatus.value =
        'Waiting for network connection to become available...';
      return false;
    }

    clearNetworkRetryTimer();

    if (isAttemptingConnection) {
      return false;
    }

    // Store connection parameters for potential reconnection
    authState.deviceId.value = deviceId;
    authState.password.value = password;
    shouldPersistConnection = true;

    return performConnectionAttempt(1);
  };

  /**
   * Handle disconnection event and potentially reconnect
   */
  const handleDisconnection = () => {
    if (!shouldPersistConnection) {
      return;
    }

    connectionState.isConnected.value = false;
    connectionState.isReconnecting.value = true;
    connectionState.reconnectionStatus.value =
      'Connection lost, cleaning up resources...';

    // Only cleanup the peer connection and streams, not the entire state
    closeRTCConnection();
    stopMediaStreams();

    // Reset only necessary connection state
    connectionState.eventChannel.value = null;
    connectionState.iceCandidateQueue = [];
    isAttemptingConnection = false;

    // Only attempt immediate reconnection if we're online
    if (
      authState.deviceId.value &&
      authState.password.value &&
      shouldPersistConnection
    ) {
      if (isOnline.value) {
        connectionState.reconnectionStatus.value = 'Initiating reconnection...';
        // Create a new peer connection before attempting reconnection
        connectionState.peerConnection.value = new RTCPeerConnection({
          iceServers: []
        });
        setupPeerConnectionEvents();
        setupDataChannelHandler();
        connectToDevice(authState.deviceId.value, authState.password.value);
      } else {
        connectionState.reconnectionStatus.value =
          'Waiting for network connection to become available...';
      }
    }
  };

  /**
   * Perform the actual connection attempt
   * @returns {Promise<boolean>} Success status
   */
  const performConnectionAttempt = async (count = 3) => {
    if (!shouldPersistConnection) {
      return false;
    }

    isAttemptingConnection = true;

    try {
      // Wait for network if offline
      if (!isOnline.value) {
        connectionState.reconnectionStatus.value =
          'Waiting for network connection to become available...';
        await waitForConnection();
      }

      // Initialize or reinitialize connections if needed
      connectionState.reconnectionStatus.value = 'Setting up connection...';
      if (
        !connectionState.peerConnection.value ||
        connectionState.peerConnection.value.connectionState === 'failed' ||
        connectionState.peerConnection.value.connectionState === 'closed'
      ) {
        // Create a new peer connection
        connectionState.peerConnection.value = new RTCPeerConnection({
          iceServers: []
        });
        setupPeerConnectionEvents();
        setupDataChannelHandler();
      }

      // Authenticate with remote device
      connectionState.reconnectionStatus.value = 'Waiting for network...';
      const deviceId = authState.deviceId.value;
      const password = authState.password.value;

      // Send join message with retry logic
      if (!(await sendJoinMessageWithRetry(deviceId, password, count))) {
        throw new Error('Failed to join after multiple attempts');
      }

      // Set connection timeout
      setConnectionTimeout();

      return true;
    } catch (error) {
      handleConnectionError(error);
      return false;
    }
  };

  /**
   * Send join message with retry logic
   * @param {string} deviceId - Device ID to join
   * @param {string} password - Authentication password
   * @returns {Promise<boolean>} Success status
   */
  const sendJoinMessageWithRetry = async (deviceId, password, count = 3) => {
    const maxRetries = count;

    for (let i = 0; i < maxRetries; i++) {
      try {
        sendMessage({
          type: 'join',
          room: deviceId,
          from: authState.clientId.value,
          name: authState.clientName.value,
          auth: { type: 'password', password }
        });
        return true;
      } catch {
        if (i < maxRetries - 1) {
          connectionState.reconnectionStatus.value = `Retrying authentication (attempt ${i + 2}/${maxRetries})...`;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    return false;
  };

  /**
   * Set timeout for connection attempt
   */
  const setConnectionTimeout = () => {
    if (timers.connectionAttempt) {
      clearTimeout(timers.connectionAttempt);
    }

    timers.connectionAttempt = setTimeout(() => {
      if (!connectionState.isConnected.value && shouldPersistConnection) {
        connectionState.reconnectionStatus.value =
          'Connection attempt timed out, retrying...';
        isAttemptingConnection = false;
        performConnectionAttempt();
      }
    }, 2000);
  };

  /**
   * Handle connection error and schedule retry
   */
  const handleConnectionError = () => {
    connectionState.reconnectionStatus.value =
      'Connection attempt failed, retrying in 2 seconds...';
    isAttemptingConnection = false;

    if (shouldPersistConnection) {
      // Schedule retry with exponential backoff
      const retryDelay = 2000;
      timers.networkRetry = setTimeout(() => {
        if (shouldPersistConnection) {
          performConnectionAttempt();
        }
      }, retryDelay);
    }
  };

  /**
   * Disconnect from the current session
   */
  const disconnect = () => {
    shouldPersistConnection = false;
    isAttemptingConnection = false;
    connectionState.reconnectionStatus.value = 'Disconnecting...';

    clearNetworkRetryTimer();

    // Send leave message
    try {
      sendMessage({
        type: 'leave',
        from: authState.clientId.value
      });
    } catch {
      // Ignore leave message send errors
    }

    cleanup();
    connectionState.reconnectionStatus.value = 'Disconnected';
  };

  /**
   * Add an ICE candidate to the peer connection
   * @param {RTCIceCandidate} iceCandidate - ICE candidate to add
   */
  const handleIceCandidate = async (iceCandidate) => {
    try {
      if (connectionState.peerConnection.value.remoteDescription) {
        await connectionState.peerConnection.value.addIceCandidate(
          new RTCIceCandidate(iceCandidate)
        );
      } else {
        connectionState.iceCandidateQueue.push(iceCandidate);
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  /**
   * Process queued ICE candidates
   */
  const processIceCandidateQueue = async () => {
    while (connectionState.iceCandidateQueue.length) {
      const iceCandidate = connectionState.iceCandidateQueue.shift();
      try {
        await connectionState.peerConnection.value.addIceCandidate(
          new RTCIceCandidate(iceCandidate)
        );
      } catch (error) {
        console.error('Error processing queued ICE candidate:', error);
      }
    }
  };

  /**
   * Get valid credential type for ICE servers
   * @param {string} type - Credential type
   * @returns {string} Valid credential type
   */
  const getValidCredentialType = (type) => {
    // Valid values for RTCIceCredentialType are "password" and "oauth"
    if (type && ['password', 'oauth'].includes(type.toLowerCase())) {
      return type.toLowerCase();
    }
    // Default to password if not specified or invalid
    return 'password';
  };

  /**
   * Handle server messages related to WebRTC
   * @param {Object} signal - Signal object from server
   */
  const handleServerMessage = async (signal) => {
    if (signal.uuid === authState.clientId.value) return;

    switch (signal.type) {
      case 'offer':
        await handleOfferMessage(signal);
        break;
      case 'ice':
        if (signal.ice) {
          await handleIceCandidate(signal.ice);
        }
        break;
    }
  };

  /**
   * Handle WebRTC offer message
   * @param {Object} signal - Offer signal from server
   */
  const handleOfferMessage = async (signal) => {
    try {
      // Process ICE servers with proper credential type handling
      const validIceServers = signal.ice_servers.map((ice) => {
        const iceServer = {
          urls: ice.urls
        };

        // Only add username and credential if they exist
        if (ice.username) {
          iceServer.username = ice.username;
        }

        if (ice.credential) {
          iceServer.credential = ice.credential;

          // Only add credentialType if credential exists and type is valid
          if (ice.credential_type) {
            iceServer.credentialType = getValidCredentialType(
              ice.credential_type
            );
          }
        }

        return iceServer;
      });

      // Update ICE servers configuration
      connectionState.peerConnection.value.setConfiguration({
        iceServers: validIceServers
      });

      // Set remote description and create answer
      await connectionState.peerConnection.value.setRemoteDescription(
        new RTCSessionDescription(signal.sdp)
      );

      await processIceCandidateQueue();

      const answer = await connectionState.peerConnection.value.createAnswer();
      await connectionState.peerConnection.value.setLocalDescription(answer);

      // Start metrics monitoring after connection is established
      startConnectionMetricsMonitoring();

      // Send answer back
      sendMessage({
        type: 'answer',
        sdp: answer,
        from: authState.clientId.value,
        to: authState.deviceId.value
      });
    } catch (error) {
      connectionState.reconnectionStatus.value = `Connection error: ${error.message}`;
      handleDisconnection();
    }
  };

  // Clean up on component unmount
  onUnmounted(() => {
    shouldPersistConnection = false;
    isAttemptingConnection = false;

    try {
      // Try to send leave message before unmounting
      if (authState.clientId.value) {
        sendMessage({
          type: 'leave',
          from: authState.clientId.value
        });
      }
    } catch {
      // Ignore leave message send errors during unmount
    }

    cleanup();
  });

  // Return public API
  return {
    // Core connection methods
    initConnections,
    connectToDevice,
    disconnect,
    handleServerMessage,

    // Connection state and streams
    peerConnection: connectionState.peerConnection,
    eventChannel: connectionState.eventChannel,
    videoStream: connectionState.videoStream,
    audioStream: connectionState.audioStream,
    isConnected: connectionState.isConnected,
    isReconnecting: connectionState.isReconnecting,
    reconnectionStatus: connectionState.reconnectionStatus,

    // Client identification
    uuid: authState.clientId,
    currentDeviceId: authState.deviceId,

    // Connection metrics
    latency: connectionState.latency,
    connectionType: connectionState.connectionType,
    videoStats: stats.video,
    connectionStats: stats.connection,

    // External dependencies
    websocket,
    isOnline
  };
}
