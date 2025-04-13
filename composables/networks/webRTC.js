import { ref, onUnmounted, watch } from 'vue';

export function webRTC(websocket, sendMessage, isOnline, waitForConnection) {
  const peerConnection = ref(null);
  const eventChannel = ref(null);
  const videoStream = ref(null);
  const audioStream = ref(null);
  const isConnected = ref(false);
  const uuid = ref(null);
  const name = ref(null);
  const currentDeviceId = ref(null);
  const latency = ref(0);
  const connectionType = ref('Unknown');
  const isReconnecting = ref(false);
  const lastPassword = ref('');
  const reconnectionStatus = ref('');
  const videoStats = ref({
    fps: 0,
    resolution: { width: 0, height: 0 },
    packetsLost: 0,
    jitter: 0
  });
  const connectionStats = ref({
    bytesReceived: 0,
    bytesSent: 0,
    bandwidth: 0
  });

  // Connection state tracking
  let isAttemptingConnection = false;
  let shouldKeepTrying = false;
  let connectionAttemptTimeout = null;
  let latencyInterval = null;
  let lastBytesReceived = 0;
  let lastBytesSent = 0;
  let lastBandwidthUpdate = 0;
  let networkRetryTimeout = null;
  const iceCandidatesQueue = ref([]);

  // Watch for network state changes
  watch(isOnline, async (newIsOnline) => {
    if (newIsOnline && shouldKeepTrying && !isConnected.value) {
      // Clear any existing retry timeout
      if (networkRetryTimeout) {
        clearTimeout(networkRetryTimeout);
        networkRetryTimeout = null;
      }

      // Reset connection state
      isAttemptingConnection = false;

      // Trigger reconnection if we have connection details
      if (currentDeviceId.value && lastPassword.value) {
        reconnectionStatus.value =
          'Network connection restored, reconnecting...';
        await connectToDevice(currentDeviceId.value, lastPassword.value);
      }
    } else if (!newIsOnline && shouldKeepTrying) {
      reconnectionStatus.value =
        'Network connection lost, waiting for network...';
      // Force cleanup of existing connection
      cleanup();
    }
  });

  const cleanup = () => {
    // Clear all timeouts and intervals
    if (connectionAttemptTimeout) {
      clearTimeout(connectionAttemptTimeout);
      connectionAttemptTimeout = null;
    }
    if (latencyInterval) {
      clearInterval(latencyInterval);
      latencyInterval = null;
    }
    if (networkRetryTimeout) {
      clearTimeout(networkRetryTimeout);
      networkRetryTimeout = null;
    }

    // Close and cleanup WebRTC connection
    if (peerConnection.value) {
      try {
        // Close all tracks
        const senders = peerConnection.value.getSenders();
        senders.forEach((sender) => {
          if (sender.track) {
            sender.track.stop();
          }
        });

        // Close data channels
        if (eventChannel.value) {
          eventChannel.value.close();
        }

        peerConnection.value.close();
      } catch {
        // Ignore any errors during cleanup
      }
      peerConnection.value = null;
    }

    // Reset all streams
    if (videoStream.value) {
      try {
        videoStream.value.getTracks().forEach((track) => track.stop());
      } catch {
        // Ignore stream cleanup errors
      }
      videoStream.value = null;
    }
    if (audioStream.value) {
      try {
        audioStream.value.getTracks().forEach((track) => track.stop());
      } catch {
        // Ignore stream cleanup errors
      }
      audioStream.value = null;
    }

    // Reset all state
    eventChannel.value = null;
    isConnected.value = false;
    iceCandidatesQueue.value = [];
    isAttemptingConnection = false;
  };

  const initConnections = async () => {
    cleanup();

    const timestamp = Date.now();
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id) {
      return false;
    }

    uuid.value = `${userData.id}_${timestamp}`;
    name.value = userData.name;

    peerConnection.value = new RTCPeerConnection({
      iceServers: []
    });

    peerConnection.value.ontrack = (event) => {
      if (event.track.kind === 'video') {
        videoStream.value = event.streams[0];
        if (peerConnection.value?.getStats) {
          peerConnection.value
            .getStats()
            .then((stats) => {
              stats.forEach((report) => {
                if (report.type === 'track' && report.kind === 'video') {
                  videoStats.value.resolution = {
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
      } else if (event.track.kind === 'audio') {
        audioStream.value = event.streams[0];
      }
    };

    peerConnection.value.onicecandidate = (event) => {
      if (event.candidate && currentDeviceId.value) {
        try {
          sendMessage({
            type: 'ice',
            ice: event.candidate,
            from: uuid.value,
            to: currentDeviceId.value
          });
        } catch {
          // Ignore ice candidate send errors
        }
      }
    };

    peerConnection.value.onconnectionstatechange = () => {
      const state = peerConnection.value?.connectionState;

      if (state === 'connected') {
        isConnected.value = true;
        isReconnecting.value = false;
        reconnectionStatus.value = 'Connection established successfully';
        isAttemptingConnection = false;

        // Clear any pending retry timeouts
        if (networkRetryTimeout) {
          clearTimeout(networkRetryTimeout);
          networkRetryTimeout = null;
        }
      } else if (state === 'disconnected' || state === 'failed') {
        if (shouldKeepTrying) {
          handleDisconnection();
        }
      }
    };

    setupDataChannelHandler();
    startLatencyUpdate();
    return true;
  };

  const connectToDevice = async (deviceId, password) => {
    // Don't attempt connection if we're offline
    if (!isOnline.value) {
      reconnectionStatus.value =
        'Waiting for network connection to become available...';
      return false;
    }

    // Clear any existing retry timeout
    if (networkRetryTimeout) {
      clearTimeout(networkRetryTimeout);
      networkRetryTimeout = null;
    }

    if (isAttemptingConnection) {
      return false;
    }

    currentDeviceId.value = deviceId;
    lastPassword.value = password;
    shouldKeepTrying = true;

    const attemptConnection = async () => {
      if (!shouldKeepTrying) {
        return;
      }

      isAttemptingConnection = true;

      try {
        if (!isOnline.value) {
          reconnectionStatus.value =
            'Waiting for network connection to become available...';
          await waitForConnection();
        }

        reconnectionStatus.value = 'Setting up WebRTC connection...';
        if (
          !peerConnection.value ||
          peerConnection.value.connectionState === 'failed'
        ) {
          await initConnections();
        }

        reconnectionStatus.value = 'Authenticating with remote device...';

        // Send join message with retry logic
        let joinSuccess = false;
        for (let i = 0; i < 3; i++) {
          try {
            sendMessage({
              type: 'join',
              room: deviceId,
              from: uuid.value,
              name: name.value,
              auth: { type: 'password', password }
            });
            joinSuccess = true;
            break;
          } catch {
            if (i < 2) {
              reconnectionStatus.value = `Retrying authentication (attempt ${i + 2}/3)...`;
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        if (!joinSuccess) {
          throw new Error('Failed to join after multiple attempts');
        }

        reconnectionStatus.value = 'Waiting for connection confirmation...';

        // Set connection attempt timeout
        if (connectionAttemptTimeout) {
          clearTimeout(connectionAttemptTimeout);
        }

        connectionAttemptTimeout = setTimeout(() => {
          if (!isConnected.value && shouldKeepTrying) {
            reconnectionStatus.value =
              'Connection attempt timed out, retrying...';
            isAttemptingConnection = false;
            attemptConnection();
          }
        }, 5000);
      } catch {
        reconnectionStatus.value =
          'Connection attempt failed, retrying in 2 seconds...';
        isAttemptingConnection = false;

        if (shouldKeepTrying) {
          // Schedule retry with exponential backoff
          const retryDelay = isOnline.value ? 2000 : 5000;
          networkRetryTimeout = setTimeout(() => {
            if (shouldKeepTrying) {
              attemptConnection();
            }
          }, retryDelay);
        }
      }
    };

    await attemptConnection();
    return true;
  };

  const handleDisconnection = () => {
    if (!shouldKeepTrying) {
      return;
    }

    isConnected.value = false;
    isReconnecting.value = true;
    reconnectionStatus.value = 'Connection lost, cleaning up resources...';
    cleanup();

    try {
      sendMessage({
        type: 'leave',
        from: uuid.value
      });
    } catch {
      // Ignore leave message send errors
    }

    // Only attempt immediate reconnection if we're online
    if (currentDeviceId.value && lastPassword.value && shouldKeepTrying) {
      if (isOnline.value) {
        reconnectionStatus.value = 'Initiating reconnection...';
        connectToDevice(currentDeviceId.value, lastPassword.value);
      } else {
        reconnectionStatus.value =
          'Waiting for network connection to become available...';
      }
    }
  };

  const disconnect = () => {
    shouldKeepTrying = false;
    isAttemptingConnection = false;
    reconnectionStatus.value = 'Disconnecting...';

    // Clear any pending retry timeouts
    if (networkRetryTimeout) {
      clearTimeout(networkRetryTimeout);
      networkRetryTimeout = null;
    }

    try {
      sendMessage({
        type: 'leave',
        from: uuid.value
      });
    } catch {
      // Ignore leave message send errors
    }

    cleanup();
    reconnectionStatus.value = 'Disconnected';
  };

  onUnmounted(() => {
    shouldKeepTrying = false;
    isAttemptingConnection = false;

    try {
      // Try to send leave message before unmounting
      if (uuid.value) {
        sendMessage({
          type: 'leave',
          from: uuid.value
        });
      }
    } catch {
      // Ignore leave message send errors during unmount
    }

    cleanup();
  });

  const setupDataChannelHandler = () => {
    if (peerConnection.value) {
      peerConnection.value.ondatachannel = (event) => {
        const dataChannel = event.channel;

        dataChannel.onopen = () => {
          eventChannel.value = dataChannel;
        };

        dataChannel.onclose = () => {
          eventChannel.value = null;
        };
      };
    }
  };

  const startLatencyUpdate = () => {
    latencyInterval = setInterval(() => {
      if (peerConnection.value && peerConnection.value.getStats) {
        peerConnection.value.getStats().then((stats) => {
          stats.forEach((report) => {
            if (
              report.type === 'candidate-pair' &&
              (report.state === 'succeeded' || report.selected)
            ) {
              latency.value =
                (report.currentRoundTripTime || report.roundTripTime || 0) *
                1000;

              // Find the local and remote candidate reports
              const localCandidateId = report.localCandidateId;
              const remoteCandidateId = report.remoteCandidateId;

              let localCandidateType = '';
              let remoteCandidateType = '';

              // Look for the candidate types
              stats.forEach((stat) => {
                if (
                  stat.type === 'local-candidate' &&
                  stat.id === localCandidateId
                ) {
                  localCandidateType = stat.candidateType;
                }
                if (
                  stat.type === 'remote-candidate' &&
                  stat.id === remoteCandidateId
                ) {
                  remoteCandidateType = stat.candidateType;
                }
              });

              // Determine connection type based on candidate types
              if (
                localCandidateType === 'relay' ||
                remoteCandidateType === 'relay'
              ) {
                connectionType.value = 'Relayed';
              } else {
                connectionType.value = 'Direct';
              }

              // Update connection stats
              const now = Date.now();
              const timeDiff = (now - lastBandwidthUpdate) / 1000; // in seconds

              if (timeDiff >= 1) {
                const bytesReceivedDiff =
                  report.bytesReceived - lastBytesReceived;
                const bytesSentDiff = report.bytesSent - lastBytesSent;

                connectionStats.value = {
                  ...connectionStats.value,
                  bytesReceived: report.bytesReceived,
                  bytesSent: report.bytesSent,
                  bandwidth:
                    ((bytesReceivedDiff + bytesSentDiff) * 8) / timeDiff / 1000 // in kbps
                };

                lastBytesReceived = report.bytesReceived;
                lastBytesSent = report.bytesSent;
                lastBandwidthUpdate = now;
              }
            }

            // Video stats
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              videoStats.value.fps = report.framesPerSecond || 0;
              videoStats.value.packetsLost = report.packetsLost || 0;
              videoStats.value.jitter = report.jitter || 0;
              videoStats.value.resolution = {
                width: report.frameWidth || 0,
                height: report.frameHeight || 0
              };
            }
          });
        });
      }
    }, 1000);
  };

  const handleIceCandidate = async (iceCandidate) => {
    try {
      if (peerConnection.value.remoteDescription) {
        await peerConnection.value.addIceCandidate(
          new RTCIceCandidate(iceCandidate)
        );
      } else {
        iceCandidatesQueue.value.push(iceCandidate);
      }
    } catch (e) {
      console.error('Error adding ICE candidate:', e);
    }
  };

  const processIceCandidateQueue = async () => {
    while (iceCandidatesQueue.value.length) {
      const iceCandidate = iceCandidatesQueue.value.shift();
      try {
        await peerConnection.value.addIceCandidate(
          new RTCIceCandidate(iceCandidate)
        );
      } catch (e) {
        console.error('Error processing queued ICE candidate:', e);
      }
    }
  };

  const getValidCredentialType = (type) => {
    // Valid values for RTCIceCredentialType are "password" and "oauth"
    if (type && ['password', 'oauth'].includes(type.toLowerCase())) {
      return type.toLowerCase();
    }
    // Default to password if not specified or invalid
    return 'password';
  };

  const handleServerMessage = async (signal) => {
    if (signal.uuid === uuid.value) return;

    switch (signal.type) {
      case 'offer':
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

          peerConnection.value.setConfiguration({
            iceServers: validIceServers
          });

          await peerConnection.value.setRemoteDescription(
            new RTCSessionDescription(signal.sdp)
          );
          await processIceCandidateQueue();

          const answer = await peerConnection.value.createAnswer();
          await peerConnection.value.setLocalDescription(answer);
          sendMessage({
            type: 'answer',
            sdp: answer,
            from: uuid.value,
            to: currentDeviceId.value
          });
        } catch (error) {
          reconnectionStatus.value = `Connection error: ${error.message}`;
          handleDisconnection();
        }
        break;
      case 'ice':
        if (signal.ice) {
          await handleIceCandidate(signal.ice);
        }
        break;
    }
  };

  return {
    initConnections,
    connectToDevice,
    disconnect,
    handleServerMessage,
    peerConnection,
    eventChannel,
    videoStream,
    audioStream,
    isConnected,
    isReconnecting,
    reconnectionStatus,
    uuid,
    currentDeviceId,
    latency,
    connectionType,
    videoStats,
    connectionStats,
    websocket,
    isOnline
  };
}
