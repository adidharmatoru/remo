<template>
  <div class="relative h-screen w-full overflow-hidden bg-bg-secondary">
    <!-- Video Stream -->
    <div class="relative h-full w-full" :class="{ fullscreen: isFullscreen }">
      <video
        ref="videoRef"
        class="h-full w-full object-contain"
        autoplay
        muted
        playsinline
        @mouseup="onVideoMouse('mouse_up')"
        @mousedown="onVideoMouse('mouse_down')"
        @mousemove="onVideoMouse('mouse_move')"
        @wheel="onVideoWheel"
      />
    </div>

    <!-- Audio Element -->
    <audio ref="audioRef" autoplay />

    <!-- Password Modal -->
    <TransitionRoot appear :show="showPasswordModal" as="template">
      <Dialog as="div" @close="closePasswordModal" class="relative z-50">
        <TransitionChild
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-canvas-subtle backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel
                class="w-full max-w-md overflow-hidden rounded-lg border border-border-default bg-canvas-default shadow-xl"
              >
                <div class="relative p-6">
                  <DialogTitle
                    class="mb-4 text-xl font-medium text-high-contrast text-center"
                  >
                    Connect to Device
                  </DialogTitle>

                  <div class="mb-4">
                    <input
                      v-model="password"
                      type="password"
                      placeholder="Enter device password"
                      class="w-full rounded-lg border border-border-default bg-canvas-subtle px-4 py-2 text-high-contrast placeholder-default transition-colors focus:border-accent-emphasis focus:outline-none"
                      @keyup.enter="attemptConnection"
                    />
                    <p v-if="errorMessage" class="mt-2 text-sm text-danger-fg">
                      {{ errorMessage }}
                    </p>
                  </div>

                  <div class="flex justify-end space-x-4">
                    <button
                      class="rounded-lg px-4 py-2 text-default transition-colors hover:text-high-contrast"
                      @click="closePasswordModal"
                    >
                      Cancel
                    </button>
                    <button
                      class="flex items-center rounded-lg bg-accent-emphasis px-4 py-2 transition-all hover:bg-accent-emphasis/90"
                      @click="attemptConnection"
                    >
                      <Icon
                        name="heroicons:link-20-solid"
                        class="mr-2 h-4 w-4"
                      />
                      Connect
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Interaction Prompt -->
    <div
      v-if="showInteractPrompt"
      class="fixed inset-0 flex items-center justify-center bg-black/50"
    >
      <div class="rounded-lg bg-white p-6">
        <h2 class="mb-2 text-lg font-bold">Interaction Required</h2>
        <p class="mb-4">Please click to enable audio playback</p>
        <button @click="retryAudio" class="rounded bg-primary-600 px-4 py-2">
          Enable Audio
        </button>
      </div>
    </div>

    <!-- Floating Control Menu -->
    <FloatingMenu
      v-if="isConnected"
      :primary-label="latency"
      secondary-label="ms"
      :minimize-delay="5000"
      title="Stream Controls"
      @toggle="toggleMenu"
      class="floating-menu"
    >
      <template #additional-menus>
        <!-- Mouse Toggle -->
        <div class="floating-menu-divider" />
        <button
          class="menu-item"
          title="Toggle Mouse"
          :class="mouseEnabled ? 'text-primary-500' : ''"
          @click="toggleMouse"
          tabindex="-1"
        >
          <Icon :name="mouseEnabled ? 'lucide:mouse' : 'lucide:mouse-off'" />
        </button>

        <!-- Keyboard Toggle -->
        <div class="floating-menu-divider" />
        <button
          class="menu-item"
          title="Toggle Keyboard"
          :class="keyboardEnabled ? 'text-primary-500' : ''"
          @click="toggleKeyboard"
          tabindex="-1"
        >
          <Icon
            :name="keyboardEnabled ? 'lucide:keyboard' : 'lucide:keyboard-off'"
          />
        </button>

        <!-- Audio Toggle -->
        <div class="floating-menu-divider" />
        <button
          class="menu-item"
          title="Toggle Audio"
          :class="audioEnabled ? 'text-primary-500' : ''"
          @click="toggleAudio"
          tabindex="-1"
        >
          <Icon :name="audioEnabled ? 'lucide:volume-2' : 'lucide:volume-x'" />
        </button>

        <!-- Fullscreen Toggle -->
        <div class="floating-menu-divider" />
        <button
          class="menu-item"
          title="Toggle Fullscreen"
          :class="isFullscreen ? 'text-primary-500' : ''"
          @click="toggleFullscreen"
          tabindex="-1"
        >
          <Icon :name="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'" />
        </button>

        <!-- Mouse Lock Toggle -->
        <div class="floating-menu-divider" />
        <button
          class="menu-item"
          title="Toggle Mouse Lock"
          :class="isPointerLocked ? 'text-primary-500' : ''"
          @click="toggleMouseLock"
          tabindex="-1"
        >
          <Icon :name="isPointerLocked ? 'lucide:lock' : 'lucide:unlock'" />
        </button>

        <!-- Disconnect Button -->
        <div class="floating-menu-divider" />
        <button
          class="menu-item text-red-500"
          @click="handleDisconnect"
          title="Disconnect"
          tabindex="-1"
        >
          <Icon name="lucide:power" />
        </button>
      </template>
    </FloatingMenu>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from '@headlessui/vue';
import { useConnection } from '../composeables/useConnection';

const router = useRouter();
const route = useRoute();
const videoRef = ref(null);
const audioRef = ref(null);
const showInteractPrompt = ref(false);
const showPasswordModal = ref(true);
const password = ref('');
const errorMessage = ref('');
const isConnected = ref(false);

// State variables
const mouseEnabled = ref(false);
const mouseTrackEnabled = ref(false);
const keyboardEnabled = ref(false);
const isFullscreen = ref(false);
const isPointerLocked = ref(false);
const audioEnabled = ref(true);

const ButtonName = ['left', 'middle', 'right'];

const {
  initConnections,
  connectToDevice,
  disconnect,
  handleServerMessage,
  eventChannel,
  videoStream,
  audioStream,
  serverConnection,
  latency
} = useConnection();

// Watch for eventChannel changes
watch(eventChannel, (newChannel) => {
  if (newChannel) {
    console.log('Event channel established');
  }
});

const sendEventData = (data) => {
  if (eventChannel.value && eventChannel.value.readyState === 'open') {
    eventChannel.value.send(JSON.stringify(data));
  } else {
    console.warn('Event channel not ready');
  }
};

const closePasswordModal = () => {
  showPasswordModal.value = false;
  router.push('/devices');
};

const attemptConnection = async () => {
  const deviceId = route.query.deviceId;
  if (!deviceId || !password.value) {
    errorMessage.value = 'Device ID and password are required.';
    return;
  }

  const success = await connectToDevice(deviceId, password.value);
  if (!success) {
    errorMessage.value = 'Connection failed. Please try again.';
    return;
  }
};

const handleDisconnect = () => {
  disconnect();
  router.push('/devices');
};

// Mouse event handlers
const onVideoMouse = (action) => (event) => {
  if (!mouseEnabled.value) return;
  event.preventDefault();

  const video = videoRef.value;
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

  if (action === 'mouse_move' && !mouseTrackEnabled.value && !event.buttons)
    return;

  const coords = toSharerCoordinate(event);
  const eventData = {
    type: action,
    ...coords,
    dx: 0,
    dy: 0,
    ...(action !== 'mouse_move' ? { button: ButtonName[event.button] } : {})
  };

  sendEventData(eventData);
};

const onVideoWheel = (event) => {
  if (!mouseEnabled.value) return;
  event.preventDefault();

  const video = videoRef.value;
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

  const sensitivity = 2;

  // Normalize wheel delta values
  const deltaX = event.deltaX ? event.deltaX : event.wheelDeltaX; // For older browsers
  const deltaY = event.deltaY ? event.deltaY : -event.wheelDelta; // For older browsers

  const eventData = {
    type: 'mouse_wheel',
    x: parseInt(deltaX, 10),
    y: parseInt(deltaY / sensitivity, 10),
  };
  sendEventData(eventData);
};

// Keyboard event handlers
const handleKeyAction = (action) => (event) => {
  if (!keyboardEnabled.value) return;
  event.preventDefault();

  sendEventData({
    type: action,
    key: event.code
  });
};

// Toggle functions
const toggleMouseTrack = () => {
  mouseTrackEnabled.value = !mouseTrackEnabled.value;
};

const toggleMouse = () => {
  mouseEnabled.value = !mouseEnabled.value;
  toggleMouseTrack();
  updateMouseListeners();
};

const toggleKeyboard = () => {
  keyboardEnabled.value = !keyboardEnabled.value;
  updateKeyboardListeners();
};

const toggleFullscreen = async () => {
  if (!isFullscreen.value) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

// Add audio toggle function
const toggleAudio = () => {
  audioEnabled.value = !audioEnabled.value;
  if (audioRef.value) {
    audioRef.value.muted = !audioEnabled.value;
  }
};

// Helper functions
const updateMouseListeners = () => {
  if (!videoRef.value) return;

  if (mouseEnabled.value) {
    videoRef.value.onmouseup = onVideoMouse('mouse_up');
    videoRef.value.onmousedown = onVideoMouse('mouse_down');
    videoRef.value.onmousemove = onVideoMouse('mouse_move');
    videoRef.value.onwheel = onVideoWheel;
    document.oncontextmenu = () => false;
  } else {
    videoRef.value.onmouseup = null;
    videoRef.value.onmousedown = null;
    videoRef.value.onmousemove = null;
    videoRef.value.onwheel = null;
    document.oncontextmenu = null;
  }
};

const toggleMouseLock = async () => {
  try {
    if (!isPointerLocked.value) {
      await videoRef.value.requestPointerLock();
      document.addEventListener('mousemove', onMouseMove, false);
    } else {
      document.exitPointerLock();
      document.removeEventListener('mousemove', onMouseMove, false);
    }
  } catch (error) {
    console.error('Pointer lock toggle failed:', error);
  }
};

let onMouseMove = (event) => {
  if (document.pointerLockElement === videoRef.value) {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    sendEventData({
      type: 'mouse_move',
      dx: movementX,
      dy: movementY,
      x: 0,
      y: 0
    });
  }
};

const updateKeyboardListeners = () => {
  if (keyboardEnabled.value) {
    document.addEventListener('keydown', handleKeyAction('key_down'));
    document.addEventListener('keyup', handleKeyAction('key_up'));
  } else {
    document.removeEventListener('keydown', handleKeyAction('key_down'));
    document.removeEventListener('keyup', handleKeyAction('key_up'));
  }
};

// Retry audio playback
const retryAudio = async () => {
  try {
    await audioRef.value.play();
    showInteractPrompt.value = false; // Hide prompt on success
  } catch (error) {
    console.error('Audio playback still failed:', error);
  }
};

// Updated coordinate conversion function
const toSharerCoordinate = (event) => {
  const video = videoRef.value;
  const rect = video.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const viewW = video.offsetWidth;
  const viewH = video.offsetHeight;
  const videoW = video.videoWidth;
  const videoH = video.videoHeight;

  if (viewH / viewW > videoH / videoW) {
    // Extra space on top and bottom
    const scale = viewW / videoW;
    const x = mouseX / scale;
    const y = (mouseY - (viewH - videoH * scale) / 2) / scale;
    return { x: Math.round(x), y: Math.round(y) };
  } else {
    // Extra space on left and right
    const scale = viewH / videoH;
    const x = (mouseX - (viewW - videoW * scale) / 2) / scale;
    const y = mouseY / scale;
    return { x: Math.round(x), y: Math.round(y) };
  }
};

// Initialize connections
onMounted(async () => {
  const success = initConnections();
  if (!success) {
    router.push('/devices');
    return;
  }

  if (serverConnection.value) {
    // Check if password is provided in URL
    if (route.query.pwd) {
      password.value = route.query.pwd;
      await attemptConnection(); // Attempt connection with provided password
    }

    serverConnection.value.onmessage = async (event) => {
      const signal = JSON.parse(event.data);

      if (signal.type === 'join_declined') {
        errorMessage.value = 'Join declined: ' + signal.reason;
      } else if (signal.type === 'offer') {
        await handleServerMessage(signal);
        isConnected.value = true;
        showPasswordModal.value = false;

        // Set up video and audio streams after connection is established
        if (videoStream.value) {
          videoRef.value.srcObject = videoStream.value;
        } else {
          console.error('Video stream not available');
        }

        if (audioStream.value) {
          audioRef.value.srcObject = audioStream.value;
          try {
            await audioRef.value.play();
          } catch (error) {
            console.error('Audio playback failed:', error);
            showInteractPrompt.value = true; // Prompt for user interaction
          }
        } else {
          console.error('Audio stream not available');
        }
      } else if (signal.type === 'room_closed') {
        errorMessage.value = 'The device is currently offline.';
        router.push('/devices');
      } else {
        await handleServerMessage(signal);
      }
    };

    // Add fullscreen change event listeners
    const fullscreenChangeHandler = () => {
      isFullscreen.value = Boolean(
        document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    document.addEventListener(
      'webkitfullscreenchange',
      fullscreenChangeHandler
    );
    document.addEventListener('msfullscreenchange', fullscreenChangeHandler);

    // Add pointer lock change event listener
    document.addEventListener('pointerlockchange', () => {
      isPointerLocked.value = document.pointerLockElement === videoRef.value;
    });
  }

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === videoRef.value) {
      console.log('Pointer locked');
    } else {
      console.log('Pointer unlocked');
    }
  });

  if (audioRef.value) {
    audioRef.value.muted = !audioEnabled.value;
  }
});

// Cleanup on component unmount
onUnmounted(() => {
  // Reset all toggle states
  audioEnabled.value = true;
  mouseEnabled.value = false;
  mouseTrackEnabled.value = false;
  keyboardEnabled.value = false;
  isPointerLocked.value = false;
  document.oncontextmenu = null;

  // Remove all event listeners
  updateKeyboardListeners();
  updateMouseListeners();
  document.removeEventListener('keydown', handleKeyAction('key_down'));
  document.removeEventListener('keyup', handleKeyAction('key_up'));
  document.removeEventListener('mousemove', onMouseMove);

  // Exit fullscreen if active
  if (document.fullscreenElement) {
    document
      .exitFullscreen()
      .catch((err) => console.error('Error exiting fullscreen:', err));
  }

  // Exit pointer lock if active
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  // Finally, disconnect
  disconnect();
});
</script>

<style scoped>
.floating-menu {
  z-index: 10000; /* Make sure it's higher than fullscreen elements */
}

.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

/* Hide video player controls on mobile devices */
video::-webkit-media-controls {
  display: none !important;
}
video::-webkit-media-controls-enclosure {
  display: none !important;
}

/* Add styles to prevent focus outlines */
.menu-item:focus {
  outline: none !important;
}
</style>
