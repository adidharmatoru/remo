<template>
  <div
    v-if="visible"
    ref="overlayRef"
    class="fixed z-[10001] bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/10 shadow-lg no-select transition-opacity"
    :class="{
      'opacity-50 hover:opacity-100': !isDragging,
      'transform scale-102': isDragging
    }"
    :style="{
      top: position.y + 'px',
      left: position.x + 'px',
      transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      transition: isDragging ? 'none' : 'all 0.2s ease',
      width: isExpanded ? '450px' : '320px'
    }"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between p-3 border-b border-white/10 cursor-move"
      @mousedown="startDragging"
      @mousemove="onDrag"
      @mouseup="stopDragging"
      @mouseleave="stopDragging"
    >
      <div class="flex items-center space-x-2">
        <Icon name="lucide:phone-call" class="w-4 h-4 text-primary-500" />
        <span class="font-medium">Call</span>
        <span
          v-if="isConnected"
          class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full"
          >Active</span
        >
        <span
          v-else
          class="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full"
          >Disconnected</span
        >
      </div>
      <div class="flex items-center space-x-2">
        <button
          class="p-1 hover:bg-white/10 rounded transition-colors flex items-center justify-center"
          @click="isExpanded = !isExpanded"
          title="Toggle expanded view"
        >
          <Icon
            :name="isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="w-4 h-4"
          />
        </button>
        <button
          class="p-1 hover:bg-white/10 rounded transition-colors flex items-center justify-center"
          @click="$emit('update:visible', false)"
          title="Close"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Connection controls -->
    <div class="p-3 border-b border-white/10">
      <div v-if="!isConnected" class="space-y-3">
        <div>
          <div class="text-sm text-white/70">Room:</div>
          <div class="font-medium">{{ currentRoom }}</div>
        </div>
        <button
          @click="connect"
          class="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
          :disabled="connecting"
        >
          <Icon name="lucide:phone" class="w-4 h-4 mr-2" />
          {{ connecting ? 'Connecting...' : 'Join Call' }}
        </button>
      </div>
      <div v-else class="flex justify-between items-center">
        <div>
          <div class="text-sm text-white/70">Room:</div>
          <div class="font-medium">{{ currentRoom }}</div>
        </div>
        <div class="flex space-x-2">
          <button
            @click="toggleMute"
            class="p-2 rounded-md transition-colors flex items-center justify-center"
            :class="
              isMuted
                ? 'bg-red-500/20 text-red-400'
                : 'bg-green-500/20 text-green-400'
            "
            title="Toggle mute"
          >
            <Icon
              :name="isMuted ? 'lucide:mic-off' : 'lucide:mic'"
              class="w-5 h-5"
            />
          </button>
          <button
            @click="toggleVideo"
            class="p-2 rounded-md transition-colors flex items-center justify-center"
            :class="
              isVideoEnabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            "
            title="Toggle video"
          >
            <Icon
              :name="isVideoEnabled ? 'lucide:video' : 'lucide:video-off'"
              class="w-5 h-5"
            />
          </button>
          <button
            @click="disconnect"
            class="p-2 bg-red-500/20 text-red-400 rounded-md transition-colors flex items-center justify-center"
            title="Leave call"
          >
            <Icon name="lucide:phone-off" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Compact participants view (when minimized) -->
    <div v-if="isConnected && !isExpanded" class="p-3">
      <div class="grid grid-cols-1 gap-2">
        <!-- Local Participant -->
        <div
          class="relative w-full h-[140px] bg-white/5 rounded-md overflow-hidden flex items-center justify-center"
        >
          <video
            v-if="localVideoTrack && isVideoEnabled"
            ref="localVideoRef"
            autoplay
            muted
            playsinline
            class="w-full h-full object-cover rounded-md"
          ></video>
          <div v-else class="absolute inset-0 flex items-center justify-center">
            <div
              class="w-10 h-10 rounded-full bg-primary-500/30 flex items-center justify-center text-sm"
            >
              {{ getInitials(displayName) }}
            </div>
          </div>
          <div
            class="absolute bottom-1 left-1 text-xs bg-black/50 px-1.5 py-0.5 rounded-md"
          >
            <span>You</span>
          </div>
        </div>

        <!-- Remote Participants -->
        <div
          v-for="participant in remoteParticipants"
          :key="participant.sid"
          class="relative w-full h-[140px] bg-white/5 rounded-md overflow-hidden flex items-center justify-center"
        >
          <video
            v-if="participantVideos[participant.sid]"
            :id="'video-' + participant.sid"
            autoplay
            playsinline
            class="w-full h-full object-cover rounded-md"
          ></video>
          <div v-else class="absolute inset-0 flex items-center justify-center">
            <div
              class="w-10 h-10 rounded-full bg-primary-500/30 flex items-center justify-center text-sm"
            >
              {{ getInitials(participant.name) }}
            </div>
          </div>
          <div
            class="absolute bottom-1 left-1 text-xs bg-black/50 px-1.5 py-0.5 rounded-md flex items-center space-x-1"
          >
            <span>{{ participant.name }}</span>
            <Icon
              v-if="participantAudio[participant.sid]"
              :name="
                participantAudioMuted[participant.sid]
                  ? 'lucide:mic-off'
                  : 'lucide:mic'
              "
              class="w-3 h-3"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Participants and videos -->
    <div
      v-if="isExpanded"
      class="p-3 overflow-y-auto"
      style="max-height: 500px"
    >
      <div v-if="isConnected">
        <!-- Local Participant -->
        <div class="mb-4">
          <div class="text-sm text-white/70 mb-2">Your Video</div>
          <div
            class="relative w-full h-[120px] bg-white/5 rounded-md overflow-hidden flex items-center justify-center"
          >
            <video
              v-if="localVideoTrack && isVideoEnabled"
              ref="localVideoRef"
              autoplay
              muted
              playsinline
              class="w-full h-full object-cover rounded-md"
            ></video>
            <div
              v-else
              class="absolute inset-0 flex items-center justify-center"
            >
              <div
                class="w-16 h-16 rounded-full bg-primary-500/30 flex items-center justify-center"
              >
                {{ getInitials(displayName) }}
              </div>
            </div>
            <div
              class="absolute bottom-2 left-2 text-xs bg-black/50 px-2 py-1 rounded-md"
            >
              {{ displayName }} (You)
            </div>
          </div>
        </div>

        <!-- Remote Participants -->
        <div v-if="remoteParticipants.length > 0">
          <div class="text-sm text-white/70 mb-2">
            Remote Participants ({{ remoteParticipants.length }})
          </div>
          <div
            v-for="participant in remoteParticipants"
            :key="participant.sid"
            class="mb-3"
          >
            <div
              class="relative w-full h-[120px] bg-white/5 rounded-md overflow-hidden flex items-center justify-center"
            >
              <video
                v-if="participantVideos[participant.sid]"
                :id="'video-' + participant.sid"
                autoplay
                playsinline
                class="w-full h-full object-cover rounded-md"
              ></video>
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center"
              >
                <div
                  class="w-16 h-16 rounded-full bg-primary-500/30 flex items-center justify-center"
                >
                  {{ getInitials(participant.name) }}
                </div>
              </div>
              <div
                class="absolute bottom-2 left-2 text-xs bg-black/50 px-2 py-1 rounded-md flex items-center space-x-1"
              >
                <span>{{ participant.name }}</span>
                <Icon
                  v-if="participantAudio[participant.sid]"
                  :name="
                    participantAudioMuted[participant.sid]
                      ? 'lucide:mic-off'
                      : 'lucide:mic'
                  "
                  class="w-3 h-3"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-white/50 py-4">
          No other participants in this call.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import {
  createLocalTracks,
  RoomEvent,
  ParticipantEvent,
  Track,
  VideoPresets
} from 'livekit-client';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  deviceId: {
    type: String,
    required: true
  },
  room: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:visible', 'connected', 'disconnected']);

// UI refs and state
const overlayRef = ref(null);
const position = ref({ x: 16, y: 150 });
const dragOffset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const isExpanded = ref(false);

// LiveKit specific refs
const localVideoRef = ref(null);
const localVideoTrack = ref(null);
const localAudioTrack = ref(null);
const isConnected = ref(false);
const connecting = ref(false);
const isMuted = ref(false);
const isVideoEnabled = ref(false);
const displayName = ref('');
const currentRoom = computed(() => props.deviceId);
const remoteParticipants = ref([]);
const participantVideos = ref({});
const participantAudio = ref({});
const participantAudioMuted = ref({});

// Initialize from localStorage
const initLocalState = () => {
  let userData;
  try {
    userData = JSON.parse(localStorage.getItem('userData') || '{}');
  } catch {
    userData = {};
  }
  displayName.value = userData.name || 'User';
};

// Get user initials for avatar
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

// Dragging functionality
const startDragging = (e) => {
  isDragging.value = true;
  const rect = overlayRef.value.getBoundingClientRect();
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

const onDrag = (e) => {
  if (!isDragging.value) return;

  const newX = e.clientX - dragOffset.value.x;
  const newY = e.clientY - dragOffset.value.y;

  // Keep the overlay within the viewport
  const rect = overlayRef.value.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width;
  const maxY = window.innerHeight - rect.height;

  position.value = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  };
};

const stopDragging = () => {
  isDragging.value = false;
};

// Connect to call (publish tracks)
const connect = async () => {
  if (!props.room) {
    console.error('Room not available');
    return;
  }

  connecting.value = true;

  try {
    // Create local tracks for audio and video
    const tracks = await createLocalTracks({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: {
        resolution: VideoPresets.h720.resolution,
        facingMode: 'user'
      }
    });

    if (!tracks || !Array.isArray(tracks)) {
      throw new Error('Failed to create local tracks');
    }

    // Store and attach local tracks
    for (const track of tracks) {
      if (track.kind === Track.Kind.Video) {
        localVideoTrack.value = track;
        // Mute video track by default
        await track.mute();
        if (localVideoRef.value) {
          track.attach(localVideoRef.value);
        }
      } else if (track.kind === Track.Kind.Audio) {
        localAudioTrack.value = track;
        isMuted.value = false;
      }
    }

    // Publish tracks
    await Promise.all(
      tracks.map((track) => props.room.localParticipant.publishTrack(track))
    );

    // Set "connected" state BEFORE setting up event listeners
    isConnected.value = true;
    emit('connected');

    // Only set up event listeners after connected
    setupEventListeners();

    // Process existing participants immediately after connecting
    processExistingParticipants();
  } catch (error) {
    console.error('Failed to connect:', error);
    cleanupTracks();
  } finally {
    connecting.value = false;
  }
};

// Disconnect from call
const disconnect = async () => {
  try {
    // Remove event listeners BEFORE changing connection state
    removeEventListeners();

    cleanupTracks();
    cleanupParticipants();

    isConnected.value = false;
    isVideoEnabled.value = false;
    emit('disconnected');
  } catch (error) {
    console.error('Error disconnecting:', error);
  }
};

// Clean up tracks
const cleanupTracks = async () => {
  if (localVideoTrack.value) {
    localVideoTrack.value.detach();
    if (props.room?.localParticipant) {
      try {
        await props.room.localParticipant.unpublishTrack(localVideoTrack.value);
      } catch (error) {
        console.error('Error unpublishing video:', error);
      }
    }
    localVideoTrack.value.stop();
    localVideoTrack.value = null;
  }

  if (localAudioTrack.value) {
    if (props.room?.localParticipant) {
      try {
        await props.room.localParticipant.unpublishTrack(localAudioTrack.value);
      } catch (error) {
        console.error('Error unpublishing audio:', error);
      }
    }
    localAudioTrack.value.stop();
    localAudioTrack.value = null;
  }

  // Remove audio elements
  document.querySelectorAll('[id^="audio-"]').forEach((el) => {
    el.remove();
  });
};

// Clean up participants state
const cleanupParticipants = () => {
  remoteParticipants.value = [];
  participantVideos.value = {};
  participantAudio.value = {};
  participantAudioMuted.value = {};
};

// Set up event listeners
const setupEventListeners = () => {
  if (!props.room || !isConnected.value) return;

  props.room
    .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
};

// Remove event listeners
const removeEventListeners = () => {
  if (!props.room) return;

  props.room
    .off(RoomEvent.ParticipantConnected, handleParticipantConnected)
    .off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
};

// Process existing participants in the room
const processExistingParticipants = () => {
  if (!props.room?.remoteParticipants || !isConnected.value) return;

  Array.from(props.room.remoteParticipants.values()).forEach((participant) => {
    handleParticipantConnected(participant);
  });
};

// Handle participant connected
const handleParticipantConnected = (participant) => {
  // Only process participants when connected
  if (!isConnected.value) return;

  // Add to participants list if not already present
  if (!remoteParticipants.value.find((p) => p.sid === participant.sid)) {
    remoteParticipants.value = [...remoteParticipants.value, participant];
  }

  // Set up track event handlers
  setupParticipantTrackHandlers(participant);

  // Process existing tracks
  processParticipantTracks(participant);
};

// Handle participant disconnected
const handleParticipantDisconnected = (participant) => {
  // Only process participant disconnects when connected
  if (!isConnected.value) return;

  remoteParticipants.value = remoteParticipants.value.filter(
    (p) => p.sid !== participant.sid
  );
  delete participantVideos.value[participant.sid];
  delete participantAudio.value[participant.sid];
  delete participantAudioMuted.value[participant.sid];

  // Remove audio element
  const audioEl = document.getElementById(`audio-${participant.sid}`);
  if (audioEl) audioEl.remove();
};

// Set up track event handlers for a participant
const setupParticipantTrackHandlers = (participant) => {
  participant
    .on(ParticipantEvent.TrackPublished, async (publication) => {
      await publication.setSubscribed(true);
    })
    .on(ParticipantEvent.TrackSubscribed, (track) => {
      handleTrackSubscribed(participant, track);
    })
    .on(ParticipantEvent.TrackUnsubscribed, (track) => {
      track.detach();
      if (track.kind === Track.Kind.Video) {
        participantVideos.value[participant.sid] = false;
      } else if (track.kind === Track.Kind.Audio) {
        participantAudio.value[participant.sid] = false;
        const audioEl = document.getElementById(`audio-${participant.sid}`);
        if (audioEl) audioEl.remove();
      }
    })
    .on(ParticipantEvent.TrackMuted, (track) => {
      if (track.kind === Track.Kind.Audio) {
        participantAudioMuted.value[participant.sid] = true;
      } else if (track.kind === Track.Kind.Video) {
        participantVideos.value[participant.sid] = false;
      }
    })
    .on(ParticipantEvent.TrackUnmuted, (track) => {
      if (track.kind === Track.Kind.Audio) {
        participantAudioMuted.value[participant.sid] = false;
      } else if (track.kind === Track.Kind.Video) {
        participantVideos.value[participant.sid] = true;
      }
    });
};

// Process existing tracks for a participant
const processParticipantTracks = (participant) => {
  if (!participant.trackPublications) return;

  Array.from(participant.trackPublications.values()).forEach(
    async (publication) => {
      try {
        // Ensure subscribed
        if (!publication.isSubscribed) {
          await publication.setSubscribed(true);
        }

        // Handle if track is already available
        if (publication.track) {
          handleTrackSubscribed(participant, publication.track);
        }
      } catch (error) {
        console.error('Failed to process track:', error);
      }
    }
  );
};

// Handle track subscribed
const handleTrackSubscribed = async (participant, track) => {
  if (track.kind === Track.Kind.Video) {
    participantVideos.value[participant.sid] = true;

    await nextTick();
    const videoEl = document.getElementById(`video-${participant.sid}`);
    if (videoEl) {
      try {
        await track.attach(videoEl);
      } catch (error) {
        console.error('Failed to attach video:', error);
      }
    }
  } else if (track.kind === Track.Kind.Audio) {
    participantAudio.value[participant.sid] = true;
    participantAudioMuted.value[participant.sid] = track.isMuted;

    try {
      // Create dedicated audio element
      const audioEl = new Audio();
      audioEl.id = `audio-${participant.sid}`;
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);

      await track.attach(audioEl);
    } catch (error) {
      console.error('Failed to attach audio:', error);
    }
  }
};

// Toggle audio mute
const toggleMute = async () => {
  if (!localAudioTrack.value) return;
  isMuted.value = !isMuted.value;

  try {
    if (isMuted.value) {
      await localAudioTrack.value.mute();
    } else {
      await localAudioTrack.value.unmute();
    }
  } catch (error) {
    console.error('Error toggling audio mute:', error);
  }
};

// Toggle video
const toggleVideo = async () => {
  if (!localVideoTrack.value) return;
  isVideoEnabled.value = !isVideoEnabled.value;

  try {
    if (!isVideoEnabled.value) {
      await localVideoTrack.value.mute();
    } else {
      await localVideoTrack.value.unmute();
      // Re-attach video track to local video element when enabling
      await nextTick();
      if (localVideoRef.value) {
        localVideoTrack.value.attach(localVideoRef.value);
      }
    }
  } catch (error) {
    console.error('Error toggling video:', error);
  }
};

// Watch for room changes
watch(
  () => props.room,
  (newRoom) => {
    if (newRoom && isConnected.value) {
      removeEventListeners();
      setupEventListeners();
      processExistingParticipants();
    }
  }
);

// Watch for visibility changes
watch(
  () => props.visible,
  (newVisible) => {
    if (!newVisible && isConnected.value) {
      disconnect();
    }
  }
);

// Save position to localStorage
const savePosition = () => {
  localStorage.setItem('livekit-call-position', JSON.stringify(position.value));
};

// Load position from localStorage
const loadPosition = () => {
  const saved = localStorage.getItem('livekit-call-position');
  if (saved) {
    try {
      position.value = JSON.parse(saved);
    } catch (error) {
      console.error('Failed to parse saved position:', error);
    }
  }
};

// Life cycle hooks
onMounted(() => {
  initLocalState();
  loadPosition();
});

onUnmounted(() => {
  savePosition();
  disconnect();
});
</script>

<style scoped>
video {
  background-color: #1a1a1a;
}

:deep(video::-webkit-media-controls) {
  display: none !important;
}

:deep(video::-webkit-media-controls-enclosure) {
  display: none !important;
}
</style>
