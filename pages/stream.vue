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
import { webRTC } from '../composables/networks/webRTC';
import { videoTrack } from '../composables/tracks/videoTrack';
import { audioTrack } from '../composables/tracks/audioTrack';
import { mouseControl } from '../composables/controls/mouseControl';
import { keyboardControl } from '../composables/controls/keyboardControl';

const router = useRouter();
const route = useRoute();
const showPasswordModal = ref(true);
const password = ref('');
const errorMessage = ref('');
const isConnected = ref(false);

// Initialize tracks
const {
  videoRef,
  isFullscreen,
  initVideoTrack,
  toggleFullscreen,
  setupFullscreenListeners,
  cleanup: cleanupVideo
} = videoTrack();

const {
  audioRef,
  audioEnabled,
  showInteractPrompt,
  initAudioTrack,
  toggleAudio,
  retryAudio,
  cleanup: cleanupAudio
} = audioTrack();

// Initialize connection
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
} = webRTC();

// Initialize mouse controls
const {
  mouseEnabled,
  isPointerLocked,
  toggleMouse,
  toggleMouseLock,
  onVideoMouse,
  onVideoWheel,
  cleanup: cleanupMouse
} = mouseControl(videoRef, eventChannel);

// Initialize keyboard controls
const {
  keyboardEnabled,
  toggleKeyboard,
  cleanup: cleanupKeyboard
} = keyboardControl(eventChannel);

// Watch for eventChannel changes
/*global watch*/
watch(eventChannel, (newChannel) => {
  if (newChannel) {
    console.log('Event channel established');
  }
});

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

  const success = connectToDevice(deviceId, password.value);
  if (!success) {
    errorMessage.value = 'Connection failed. Please try again.';
    return;
  }
};

const handleDisconnect = () => {
  disconnect();
  router.push('/devices');
};

// Initialize connections
onMounted(async () => {
  const success = initConnections();
  if (!success) {
    router.push('/devices');
    return;
  }

  setupFullscreenListeners();

  if (serverConnection.value) {
    // Check if password is provided in URL
    if (route.query.pwd) {
      password.value = route.query.pwd;
      await attemptConnection();
    }

    serverConnection.value.onmessage = async (event) => {
      const signal = JSON.parse(event.data);

      if (signal.type === 'join_declined') {
        errorMessage.value = 'Join declined: ' + signal.reason;
      } else if (signal.type === 'offer') {
        await handleServerMessage(signal);
        isConnected.value = true;
        showPasswordModal.value = false;

        // Initialize video and audio tracks
        initVideoTrack(videoStream.value);
        await initAudioTrack(audioStream.value);
      } else if (signal.type === 'room_closed') {
        errorMessage.value = 'The device is currently offline.';
        router.push('/devices');
      } else {
        await handleServerMessage(signal);
      }
    };
  }
});

// Cleanup on component unmount
onUnmounted(() => {
  cleanupMouse();
  cleanupKeyboard();
  cleanupVideo();
  cleanupAudio();
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
