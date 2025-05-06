import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  Track,
  createLocalTracks,
  LocalTrack,
  ConnectionState,
  Participant,
  ParticipantEvent,
  DataPacket_Kind,
  VideoPreset,
  VideoPresets
} from 'livekit-client';
import type { RoomOptions } from 'livekit-client';
import { ref, onUnmounted, computed } from 'vue';

export const useLiveKit = () => {
  const config = useRuntimeConfig();
  const room = ref<Room | null>(null);
  const participants = ref<RemoteParticipant[]>([]);
  const connectionState = ref<ConnectionState | null>(null);
  const error = ref<Error | null>(null);
  const isConnecting = ref(false);
  const isConnected = ref(false);
  const localParticipant = computed(() => room.value?.localParticipant || null);

  // Create a new Room instance with enhanced options
  const createRoom = () => {
    if (room.value) return room.value;

    const roomOptions: RoomOptions = {
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: {
        simulcast: true,
        videoSimulcastLayers: [
          VideoPresets.h720,
          VideoPresets.h360,
          VideoPresets.h180
        ]
      },
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution
      }
    };

    const newRoom = new Room(roomOptions);

    // Set up event listeners
    newRoom
      .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      .on(RoomEvent.ConnectionStateChanged, handleConnectionStateChange)
      .on(RoomEvent.Disconnected, handleDisconnect)
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.DataReceived, handleDataReceived);

    room.value = newRoom;
    return newRoom;
  };

  // Handle participant connected event with enhanced tracking
  const handleParticipantConnected = (participant: RemoteParticipant) => {
    participants.value = [...participants.value, participant];

    // Set up participant-specific event listeners
    participant
      .on(
        ParticipantEvent.TrackPublished,
        (publication: RemoteTrackPublication) => {
          // Auto-subscribe to new tracks
          if (room.value && publication.track) {
            participant.emit(
              ParticipantEvent.TrackSubscribed,
              publication.track,
              publication
            );
          }
        }
      )
      .on(ParticipantEvent.TrackUnpublished, () => {
        // Handle track unpublished
      })
      .on(ParticipantEvent.TrackMuted, () => {
        // Handle track muted
      })
      .on(ParticipantEvent.TrackUnmuted, () => {
        // Handle track unmuted
      });
  };

  // Handle track subscribed event
  const handleTrackSubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    // Handle different track types
    if (track.kind === Track.Kind.Video) {
      // Handle video track
      track.attach();
    } else if (track.kind === Track.Kind.Audio) {
      // Handle audio track
      track.attach();
    }
  };

  // Handle track unsubscribed event
  const handleTrackUnsubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    track.detach();
  };

  // Handle data received event
  const handleDataReceived = (
    payload: Uint8Array,
    participant?: RemoteParticipant,
    kind?: DataPacket_Kind
  ) => {
    if (kind === DataPacket_Kind.RELIABLE) {
      try {
        // Forward the data directly to any listeners
        room.value?.emit(RoomEvent.DataReceived, payload, participant, kind);
      } catch (err) {
        console.error('Error handling received data:', err);
      }
    }
  };

  // Handle participant disconnected event
  const handleParticipantDisconnected = (participant: RemoteParticipant) => {
    participants.value = participants.value.filter(
      (p) => p.sid !== participant.sid
    );
  };

  // Handle connection state change event
  const handleConnectionStateChange = (state: ConnectionState) => {
    connectionState.value = state;
    isConnecting.value = state === ConnectionState.Connecting;
    isConnected.value = state === ConnectionState.Connected;
  };

  // Handle disconnect event with cleanup
  const handleDisconnect = () => {
    isConnected.value = false;
    isConnecting.value = false;
    participants.value = [];
    // Additional cleanup if needed
  };

  // Connect to a room with enhanced error handling
  const connect = async (roomName: string, identity: string) => {
    try {
      error.value = null;
      isConnecting.value = true;

      // Get a token from the server
      const response = await $fetch<{ token: string }>('/api/livekit/token', {
        method: 'POST',
        body: {
          room: roomName,
          identity
        }
      });

      const liveKitRoom = createRoom();

      // Connect to the LiveKit room
      const wsUrl = config.public.livekit?.wsUrl;
      await liveKitRoom.connect(wsUrl, response.token);

      return liveKitRoom;
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      isConnecting.value = false;
    }
  };

  // Disconnect from the room with proper cleanup
  const disconnect = () => {
    if (!room.value) return;

    // Clean up all subscribed tracks
    participants.value.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        if (publication.track) {
          publication.track.detach();
        }
      });
    });

    room.value.disconnect();
    room.value = null;
  };

  // Create local audio and video tracks with enhanced options
  const createLocalMediaTracks = async (options?: {
    audio?: boolean;
    video?: boolean;
    resolution?: VideoPreset;
  }) => {
    try {
      const tracks = await createLocalTracks({
        audio: options?.audio ?? true,
        video:
          options?.video === false
            ? false
            : {
                resolution:
                  options?.resolution?.resolution ||
                  VideoPresets.h720.resolution
              }
      });

      return tracks;
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  // Publish local tracks to the room with enhanced options
  const publishTracks = async (tracks: LocalTrack[]) => {
    if (!room.value || !isConnected.value) {
      throw new Error('Not connected to a room');
    }

    try {
      const publishPromises = tracks.map((track) =>
        room.value!.localParticipant.publishTrack(track, {
          simulcast: true,
          videoCodec: 'vp8' // or 'h264' depending on browser support
        })
      );
      return await Promise.all(publishPromises);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  // Cleanup on component unmount
  onUnmounted(() => {
    disconnect();
  });

  return {
    room,
    participants,
    connectionState,
    isConnecting,
    isConnected,
    error,
    localParticipant,
    createRoom,
    connect,
    disconnect,
    createLocalMediaTracks,
    publishTracks
  };
};
