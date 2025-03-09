<template>
  <div class="relative h-screen w-full overflow-hidden bg-bg-secondary">
    <!-- Loading Animation -->
    <LoadingAnimation
      v-if="
        isConnected &&
        (!videoStream || (fps === 0 && !hasEstablishedConnection))
      "
    />

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
    <Transition
      enter="transition-opacity duration-300"
      enter-from="opacity-0"
      enter-to="opacity-100"
      leave="transition-opacity duration-300"
      leave-from="opacity-100"
      leave-to="opacity-0"
    >
      <div
        v-if="showInteractPrompt"
        class="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      >
        <div class="text-center">
          <button
            @click="retryAudio"
            class="p-8 rounded-full bg-accent-emphasis hover:bg-accent-emphasis/90 transition-colors"
          >
            <Icon name="heroicons:speaker-wave" class="w-32 h-32 text-white" />
          </button>
          <p class="mt-4 text-xl font-semibold text-white">
            Click to enable audio
          </p>
        </div>
      </div>
    </Transition>

    <!-- Floating Control Menu -->
    <FloatingMenu
      v-if="isConnected"
      :primary-label="latency"
      secondary-label="ms"
      :minimize-delay="5000"
      title="Stream Controls"
      :tertiary-label="`${fps}`"
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

        <!-- Joystick Lock Toggle -->
        <div class="floating-menu-divider" />
        <button
          class="menu-item"
          title="Toggle Joystick"
          :class="joystickEnabled ? 'text-primary-500' : ''"
          @click="toggleJoystick"
          tabindex="-1"
        >
          <Icon
            :name="joystickEnabled ? 'lucide:gamepad-2' : 'lucide:gamepad'"
          />
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

    <!-- Virtual Joystick -->
    <VirtualJoystick
      :enabled="joystickEnabled"
      :has-physical-gamepad="hasPhysicalGamepad"
      :on-state-change="handleJoystickState"
    />
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
import VirtualJoystick from '../components/VirtualJoystick.vue';
import LoadingAnimation from '../components/LoadingAnimation.vue';
import { joystickControl } from '../composables/controls/joystickControl';

const router = useRouter();
const route = useRoute();
const showPasswordModal = ref(false);
const password = ref('');
const errorMessage = ref('');
const isConnected = ref(false);
const hasEstablishedConnection = ref(false);
/*global computed*/
const isEmbedMode = computed(() => route.query.embed === '1');

// Initialize tracks
/*global videoTrack*/
const {
  videoRef,
  isFullscreen,
  initVideoTrack,
  toggleFullscreen,
  setupFullscreenListeners,
  cleanup: cleanupVideo
} = videoTrack();

/*global audioTrack*/
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
/*global webSocket*/
const { websocket, sendMessage, isOnline, waitForConnection } =
  webSocket(false);

/*global webRTC*/
const {
  initConnections,
  connectToDevice,
  disconnect,
  handleServerMessage,
  eventChannel,
  videoStream,
  audioStream,
  latency,
  peerConnection
} = webRTC(websocket, sendMessage, isOnline, waitForConnection);

// Initialize mouse controls
/*global mouseControl*/
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
/*global keyboardControl*/
const {
  keyboardEnabled,
  toggleKeyboard,
  cleanup: cleanupKeyboard
} = keyboardControl(eventChannel);

// Initialize joystick controls
const {
  joystickEnabled,
  hasPhysicalGamepad,
  toggleJoystick,
  handleJoystickState,
  cleanup: cleanupJoystick
} = joystickControl(eventChannel);

// Add these refs near the top of the script section
const fps = ref(0);

function updateFPS() {
  if (peerConnection.value && peerConnection.value.getStats) {
    peerConnection.value.getStats().then((stats) => {
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          fps.value = report.framesPerSecond || 0;
        }
      });
    });
  }
}

// Watch for eventChannel changes
/*global watch*/
watch(eventChannel, (newChannel) => {
  if (newChannel) {
    // console.log('Event channel established');
  }
});

// Watch for successful connection
watch([videoStream, fps], ([newVideoStream, newFps]) => {
  if (newVideoStream && newFps > 0) {
    hasEstablishedConnection.value = true;
  }
});

const closePasswordModal = () => {
  showPasswordModal.value = false;
  redirectToDevices();
};

const showModalError = (error) => {
  errorMessage.value = error;
  if (!showPasswordModal.value) {
    showPasswordModal.value = true;
  }
};

const attemptConnection = async () => {
  const deviceId = route.query.deviceId;
  if (!deviceId || !password.value) {
    showModalError('Device ID and password are required.');
    return;
  }

  const success = await connectToDevice(deviceId, password.value);
  if (!success) {
    showModalError('Connection failed. Please try again.');
    return;
  }
};

const handleDisconnect = () => {
  disconnect();
  redirectToDevices();
};

const redirectToDevices = () => {
  if (!isEmbedMode.value) {
    router.push('/devices');
  }
};

// Initialize connections
onMounted(async () => {
  const success = initConnections();
  if (!success) {
    router.push('/devices');
    return;
  }

  setupFullscreenListeners();

  // Start FPS polling
  const fpsInterval = setInterval(updateFPS, 1000);

  if (websocket.value) {
    // Check if password is provided in URL
    if (route.query.pwd) {
      password.value = route.query.pwd;
      await attemptConnection();
    } else {
      showPasswordModal.value = true;
    }

    websocket.value.onmessage = async (event) => {
      const signal = JSON.parse(event.data);

      if (signal.type === 'join_declined') {
        showModalError('Join declined: ' + signal.reason);
      } else if (signal.type === 'offer') {
        await handleServerMessage(signal);
        isConnected.value = true;
        showPasswordModal.value = false;

        // Initialize video and audio tracks
        initVideoTrack(videoStream.value);
        await initAudioTrack(audioStream.value);
      } else if (signal.type === 'server_closed') {
        showModalError('The device is currently offline.');
        redirectToDevices();
      } else {
        await handleServerMessage(signal);
      }
    };
  }

  // Store the interval ID for cleanup
  onUnmounted(() => {
    clearInterval(fpsInterval);
    cleanupMouse();
    cleanupKeyboard();
    cleanupJoystick();
    cleanupVideo();
    cleanupAudio();
    disconnect();
  });
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
  z-index: 1000;
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
