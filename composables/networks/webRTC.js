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
  let latencyInterval = null;

  const iceCandidatesQueue = ref([]);
  const videoFrozen = ref(false);
  const freezeDetectionInterval = ref(null);
  const freezeThreshold = 3000;

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

      setupDataChannelHandler();
      startLatencyUpdate();
      startFreezeDetection();
      resolve(true);
    });
  };

  const setupDataChannelHandler = () => {
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
          if (videoTrackStats.framesPerSecond === 0 && !videoFrozen.value) {
            videoFrozen.value = true;
            setTimeout(() => {
              if (videoFrozen.value) {
                // console.log(
                //   'Video is frozen. Attempting to reestablish the track...'
                // );
                attemptToReestablishVideoTrack();
              }
            }, freezeThreshold);
          } else if (videoTrackStats.framesPerSecond > 0) {
            videoFrozen.value = false;
          }
        }
      }
    }, 1000);
  };

  const attemptToReestablishVideoTrack = async () => {
    try {
      if (videoStream.value) {
        videoStream.value.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      videoStream.value = newStream;
      newStream.getTracks().forEach((track) => {
        peerConnection.value.addTrack(track, newStream);
      });
      console.log('Reestablished video track successfully.');
    } catch (error) {
      console.error('Error reestablishing video track:', error);
    }
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

  const connectToDevice = async (deviceId, password) => {
    if (!isOnline.value) {
      // console.log('Waiting for connection to be established...');
      await waitForConnection();
    }

    currentDeviceId.value = deviceId;

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
    if (peerConnection.value) {
      peerConnection.value.close();
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
    eventChannel,
    videoStream,
    audioStream,
    isConnected,
    uuid,
    currentDeviceId,
    latency,
    websocket,
    isOnline
  };
}
