import { ref, onUnmounted } from 'vue';

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
  const reconnectAttempts = ref(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;
  const lastPassword = ref('');
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
  let latencyInterval = null;
  let lastBytesReceived = 0;
  let lastBytesSent = 0;
  let lastBandwidthUpdate = 0;
  let reconnectTimeout = null;

  const iceCandidatesQueue = ref([]);

  const initConnections = () => {
    return new Promise((resolve) => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (!userData.id) {
        resolve(false);
        return;
      }
      uuid.value = userData.id;
      name.value = userData.name;

      // Initialize WebRTC connection (Use iceServers from server)
      peerConnection.value = new RTCPeerConnection({
        iceServers: []
      });

      // Handle incoming tracks
      peerConnection.value.ontrack = (event) => {
        if (event.track.kind === 'video') {
          videoStream.value = event.streams[0];
          // Request stats immediately when track is received
          if (peerConnection.value.getStats) {
            peerConnection.value.getStats().then((stats) => {
              stats.forEach((report) => {
                if (report.type === 'track' && report.kind === 'video') {
                  videoStats.value.resolution = {
                    width: report.frameWidth || 0,
                    height: report.frameHeight || 0
                  };
                }
              });
            });
          }
        } else if (event.track.kind === 'audio') {
          audioStream.value = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.value.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: 'ice',
            ice: event.candidate,
            from: uuid.value,
            to: currentDeviceId.value
          });
        }
      };

      // Add connection state change handler
      peerConnection.value.onconnectionstatechange = () => {
        if (
          peerConnection.value.connectionState === 'disconnected' ||
          peerConnection.value.connectionState === 'failed'
        ) {
          handleDisconnection();
        } else if (peerConnection.value.connectionState === 'connected') {
          isConnected.value = true;
          isReconnecting.value = false;
          reconnectAttempts.value = 0;
        }
      };

      setupDataChannelHandler();
      startLatencyUpdate();
      resolve(true);
    });
  };

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
              latency.value = (report.currentRoundTripTime || report.roundTripTime || 0) * 1000;

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

  const handleServerMessage = async (signal) => {
    if (signal.uuid === uuid.value) return;

    switch (signal.type) {
      case 'offer':
        try {
          peerConnection.value.setConfiguration({
            iceServers: signal.ice_servers.map((ice) => ({
              urls: ice.urls,
              username: ice.username,
              credential: ice.credential,
              credentialType: ice.credential_type.toLowerCase()
            }))
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
        } catch (e) {
          console.error('Error handling offer:', e);
        }
        break;
      case 'ice':
        if (signal.ice) {
          await handleIceCandidate(signal.ice);
        }
        break;
    }
  };

  const handleDisconnection = async () => {
    isConnected.value = false;

    if (isReconnecting.value || !currentDeviceId.value || !lastPassword.value) {
      return;
    }

    if (reconnectAttempts.value >= maxReconnectAttempts) {
      isReconnecting.value = false;
      reconnectAttempts.value = 0;
      return;
    }

    isReconnecting.value = true;
    reconnectAttempts.value++;

    // Clear old connection
    if (peerConnection.value) {
      peerConnection.value.close();
    }
    videoStream.value = null;
    audioStream.value = null;
    eventChannel.value = null;

    // Wait before attempting reconnection
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    reconnectTimeout = setTimeout(async () => {
      await initConnections();
      await connectToDevice(currentDeviceId.value, lastPassword.value);
    }, reconnectDelay);
  };

  const connectToDevice = async (deviceId, password) => {
    if (!isOnline.value) {
      await waitForConnection();
    }

    currentDeviceId.value = deviceId;
    lastPassword.value = password;

    sendMessage({
      type: 'join',
      room: deviceId,
      from: uuid.value,
      name: name.value,
      auth: {
        type: 'password',
        password: password
      }
    });

    return true;
  };

  const disconnect = () => {
    sendMessage({
      type: 'leave',
      from: uuid.value
    });
  };

  onUnmounted(() => {
    if (latencyInterval) {
      clearInterval(latencyInterval);
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    if (peerConnection.value) {
      peerConnection.value.close();
    }
  });

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
