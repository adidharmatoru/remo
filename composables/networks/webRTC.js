import { ref, onUnmounted } from 'vue';

export function webRTC() {
  const peerConnection = ref(null);
  const serverConnection = ref(null);
  const eventChannel = ref(null);
  const videoStream = ref(null);
  const audioStream = ref(null);
  let serverKeepAlive = null;
  const isConnected = ref(false);
  const uuid = ref(null);
  const name = ref(null);
  const currentDeviceId = ref(null);
  const latency = ref(0);
  let latencyInterval = null;

  const iceCandidatesQueue = ref([]);
  const videoFrozen = ref(false); // Track if video is frozen
  const freezeDetectionInterval = ref(null); // Interval for checking freeze
  const freezeThreshold = 3000; // Time (in ms) to wait before considering video frozen

  const startFreezeDetection = () => {
    freezeDetectionInterval.value = setInterval(async () => {
      if (peerConnection.value && peerConnection.value.getStats) {
        const stats = await peerConnection.value.getStats();
        let videoTrackStats = null;

        stats.forEach((report) => {
          if (report.kind === 'video') {
            videoTrackStats = report;
          }
        });

        if (videoTrackStats) {
          // Check if frames are being received
          if (videoTrackStats.framesPerSecond === 0 && !videoFrozen.value) {
            videoFrozen.value = true;

            // Wait for the freeze threshold duration
            setTimeout(() => {
              if (videoFrozen.value) {
                console.log(
                  'Video is frozen. Attempting to reestablish the track...'
                );
                attemptToReestablishVideoTrack();
              }
            }, freezeThreshold);
          } else if (videoTrackStats.framesPerSecond > 0) {
            // Video is not frozen anymore
            videoFrozen.value = false;
          }
        }
      }
    }, 1000); // Check every second
  };

  const attemptToReestablishVideoTrack = async () => {
    try {
      // Close the existing video stream
      if (videoStream.value) {
        videoStream.value.getTracks().forEach((track) => track.stop());
      }

      // Create a new media stream
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      videoStream.value = newStream; // Set the new video stream

      // Add the new track to the peer connection
      newStream.getTracks().forEach((track) => {
        peerConnection.value.addTrack(track, newStream);
      });

      console.log('Reestablished video track successfully.');
    } catch (error) {
      console.error('Error reestablishing video track:', error);
    }
  };

  const initConnections = () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id) {
      return false;
    }
    uuid.value = userData.id;
    name.value = userData.name;

    // Initialize WebRTC connection
    peerConnection.value = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.adidharmatoru.dev:3479' }]
    });

    // Handle incoming tracks
    peerConnection.value.ontrack = (event) => {
      if (event.track.kind === 'video') {
        videoStream.value = event.streams[0];
      } else if (event.track.kind === 'audio') {
        audioStream.value = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnection.value.onicecandidate = (event) => {
      if (event.candidate && serverConnection.value) {
        serverConnection.value.send(
          JSON.stringify({
            type: 'ice',
            ice: event.candidate,
            from: uuid.value,
            to: currentDeviceId.value
          })
        );
      }
    };

    // Initialize WebSocket Server connection
    serverConnection.value = new WebSocket('wss://remote-ws.adidharmatoru.dev');

    serverConnection.value.onopen = () => {
      console.log('WebSocket connected');
      serverKeepAlive = setInterval(() => {
        serverConnection.value.send(JSON.stringify({ type: 'keep_alive' }));
      }, 30000);
      isConnected.value = true;

      setupDataChannelHandler();
      startLatencyUpdate();
      startFreezeDetection();
    };

    return true;
  };

  // Handle data channel
  const setupDataChannelHandler = () => {
    if (!serverConnection.value) return;

    // Connect data channel
    if (peerConnection.value) {
      peerConnection.value.ondatachannel = (event) => {
        const dataChannel = event.channel;

        dataChannel.onopen = () => {
          console.log('Data channel is open');
          eventChannel.value = dataChannel;
        };

        dataChannel.onclose = () => {
          console.log('Data channel is closed');
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
              report.state === 'succeeded'
            ) {
              latency.value = report.currentRoundTripTime * 1000;
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
          serverConnection.value.send(
            JSON.stringify({
              type: 'answer',
              sdp: answer,
              from: uuid.value,
              to: currentDeviceId.value
            })
          );
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

  const connectToDevice = (deviceId, password) => {
    if (!isConnected.value) return false;

    currentDeviceId.value = deviceId;

    serverConnection.value.send(
      JSON.stringify({
        type: 'join',
        room: deviceId,
        from: uuid.value,
        name: name.value,
        auth: {
          type: 'password',
          password: password
        }
      })
    );

    return true;
  };

  const disconnect = () => {
    if (serverConnection.value) {
      serverConnection.value.send(
        JSON.stringify({
          type: 'leave',
          from: uuid.value
        })
      );
    }
  };

  onUnmounted(() => {
    if (latencyInterval) {
      clearInterval(latencyInterval);
    }
    if (serverKeepAlive) {
      clearInterval(serverKeepAlive);
    }
    if (peerConnection.value) {
      peerConnection.value.close();
    }
    if (serverConnection.value) {
      serverConnection.value.close();
    }
    if (freezeDetectionInterval.value) {
      clearInterval(freezeDetectionInterval.value);
    }
  });

  return {
    initConnections,
    connectToDevice,
    disconnect,
    handleServerMessage,
    peerConnection,
    serverConnection,
    eventChannel,
    videoStream,
    audioStream,
    isConnected,
    uuid,
    currentDeviceId,
    latency
  };
}
