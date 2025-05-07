<template>
  <div
    class="relative h-screen w-full overflow-hidden bg-bg-secondary no-select"
  >
    <!-- Loading Animation -->
    <LoadingAnimation
      v-if="
        (isConnected &&
          (!videoStream || (!hasEstablishedConnection && fps === 0))) ||
        (isReconnecting && (!videoStream || !hasEstablishedConnection))
      "
      :reconnection-status="reconnectionStatus"
    />

    <!-- Video Stream -->
    <div class="relative h-full w-full" :class="{ fullscreen: isFullscreen }">
      <video
        ref="videoRef"
        class="h-full w-full object-contain"
        :class="{ 'opacity-50': isReconnecting }"
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
                    class="mb-6 text-xl font-medium text-high-contrast text-center"
                  >
                    Connect to Device
                  </DialogTitle>

                  <div class="mb-6">
                    <div class="relative">
                      <input
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="Enter device password"
                        class="w-full rounded-lg border border-border-default bg-canvas-subtle px-4 py-3 text-high-contrast placeholder-default transition-colors focus:border-accent-emphasis focus:outline-none pr-10"
                        @keyup.enter="attemptConnection"
                      />
                      <button
                        type="button"
                        class="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-default hover:text-high-contrast"
                        @click="showPassword = !showPassword"
                      >
                        <Icon
                          :name="
                            showPassword
                              ? 'heroicons:eye-slash-20-solid'
                              : 'heroicons:eye-20-solid'
                          "
                          class="h-5 w-5"
                        />
                      </button>
                    </div>
                    <p v-if="errorMessage" class="mt-2 text-sm text-danger-fg">
                      {{ errorMessage }}
                    </p>
                  </div>

                  <div class="space-y-4 mb-6">
                    <!-- Remember Password Toggle -->
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <Icon
                          name="heroicons:lock-closed-20-solid"
                          class="h-5 w-5 text-default"
                        />
                        <span class="text-sm text-default"
                          >Remember password</span
                        >
                      </div>
                      <button
                        @click="rememberPassword = !rememberPassword"
                        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                        :class="
                          rememberPassword
                            ? 'bg-green-500'
                            : 'bg-neutral-200 dark:bg-neutral-700'
                        "
                        role="switch"
                        :aria-checked="rememberPassword"
                      >
                        <span
                          aria-hidden="true"
                          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                          :class="
                            rememberPassword ? 'translate-x-5' : 'translate-x-0'
                          "
                        />
                      </button>
                    </div>

                    <!-- Enable Mouse Toggle -->
                    <!-- <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <Icon name="lucide:mouse" class="h-5 w-5 text-default" />
                        <span class="text-sm text-default">Enable mouse control</span>
                      </div>
                      <button 
                        @click="enableMouseOnConnect = !enableMouseOnConnect"
                        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                        :class="enableMouseOnConnect ? 'bg-green-500' : 'bg-neutral-200 dark:bg-neutral-700'"
                        role="switch"
                        :aria-checked="enableMouseOnConnect"
                      >
                        <span
                          aria-hidden="true"
                          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                          :class="enableMouseOnConnect ? 'translate-x-5' : 'translate-x-0'"
                        />
                      </button>
                    </div> -->

                    <!-- Enable Keyboard Toggle -->
                    <!-- <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <Icon name="lucide:keyboard" class="h-5 w-5 text-default" />
                        <span class="text-sm text-default">Enable keyboard control</span>
                      </div>
                      <button 
                        @click="enableKeyboardOnConnect = !enableKeyboardOnConnect"
                        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                        :class="enableKeyboardOnConnect ? 'bg-green-500' : 'bg-neutral-200 dark:bg-neutral-700'"
                        role="switch"
                        :aria-checked="enableKeyboardOnConnect"
                      >
                        <span
                          aria-hidden="true"
                          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                          :class="enableKeyboardOnConnect ? 'translate-x-5' : 'translate-x-0'"
                        />
                      </button>
                    </div> -->
                  </div>

                  <div class="flex justify-end space-x-4">
                    <button
                      class="rounded-lg px-4 py-2.5 text-default transition-colors hover:text-high-contrast border border-border-default hover:bg-canvas-subtle"
                      @click="closePasswordModal"
                    >
                      Cancel
                    </button>
                    <button
                      class="flex items-center rounded-lg px-4 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-border-default bg-canvas-subtle hover:bg-canvas-default text-high-contrast font-medium"
                      @click="attemptConnection"
                      :disabled="!password"
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
      :label-title="`Latency (${connectionType})`"
      @toggle="toggleMenu"
      @toggle-stats="showStats = !showStats"
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

        <!-- LiveKit Integration -->
        <div class="floating-menu-divider" />
        <button
          class="menu-item relative inline-flex items-center justify-center"
          title="Toggle Chat"
          :class="showChat ? 'text-primary-500' : ''"
          @click="toggleChat"
          tabindex="-1"
        >
          <Icon name="lucide:message-circle" class="w-4 h-4" />
          <span
            v-if="unreadMessageCount > 0"
            class="absolute top-0 right-0 -translate-x-3/4 -translate-y-1/5 rotate-[-90deg] min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-[11px] font-medium flex items-center justify-center px-1 transform-gpu"
          >
            {{ unreadMessageCount > 99 ? '99+' : unreadMessageCount }}
          </span>
        </button>

        <div class="floating-menu-divider" />
        <button
          class="menu-item"
          title="Toggle Call"
          :class="showCall ? 'text-primary-500' : ''"
          @click="toggleCall"
          tabindex="-1"
        >
          <Icon name="lucide:phone-call" />
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

    <!-- WebRTC Stats Overlay -->
    <WebRTCStatsOverlay
      v-if="isConnected"
      v-model:visible="showStats"
      :latency="latency"
      :connection-type="connectionType"
      :video-stats="videoStats"
      :connection-stats="connectionStats"
    />

    <!-- LiveKit Chat Component -->
    <LiveKitChat
      v-if="isConnected"
      v-model:visible="showChat"
      :room="livekitRoom"
      @unread-message="handleUnreadMessage"
    />

    <!-- LiveKit Call Component -->
    <LiveKitCall
      v-if="isConnected"
      v-model:visible="showCall"
      :device-id="deviceId"
      :room="livekitRoom"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from '@headlessui/vue';
import VirtualJoystick from '~/components/VirtualJoystick.vue';
import LoadingAnimation from '~/components/LoadingAnimation.vue';
import WebRTCStatsOverlay from '~/components/WebRTCStatsOverlay.vue';
import LiveKitChat from '~/components/LiveKitChat.vue';
import LiveKitCall from '~/components/LiveKitCall.vue';
import { joystickControl } from '~/composables/controls/joystickControl';
import { initializeUserData } from '~/composables/networks/webSocket';
import { liveKit } from '~/composables/networks/liveKit';

const router = useRouter();
const route = useRoute();
const showPasswordModal = ref(false);
const password = ref('');
const errorMessage = ref('');
const isConnected = ref(false);
const hasEstablishedConnection = ref(false);
const deviceId = computed(() => route.params.deviceId);
const isEmbedMode = computed(() => route.query.embed === '1');

// LiveKit functionality
const showChat = ref(false);
const showCall = ref(false);
const livekitRoom = ref(null);
const unreadMessageCount = ref(0);
const { connect: connectToLiveKit, disconnect: disconnectFromLiveKit } =
  liveKit();

/*global defineOgImageComponent*/
defineOgImageComponent('Remo', {
  headline: 'Remo - Stream',
  title: route.params.deviceId,
  description: 'Build, Stream, Game on! 🎮🔥',
  colorMode: 'light'
});

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
  connectionType,
  peerConnection,
  videoStats,
  connectionStats,
  isReconnecting,
  reconnectionStatus
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
const showStats = ref(false);

const rememberPassword = ref(false);
const enableMouseOnConnect = ref(false);
const enableKeyboardOnConnect = ref(false);
const showPassword = ref(false);

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

// Watch for successful connection
watch(
  [videoStream, fps],
  ([newVideoStream, newFps]) => {
    if (newVideoStream && newFps > 0) {
      hasEstablishedConnection.value = true;
      isConnected.value = true;
    }
  },
  { immediate: true }
);

// Reset established connection state when reconnecting starts
watch(isReconnecting, (newValue) => {
  if (newValue) {
    hasEstablishedConnection.value = false;
    // Don't set isConnected to false here, as we're just reconnecting
  }
});

// Watch for WebSocket reconnection
watch(isOnline, async (newIsOnline) => {
  if (newIsOnline && websocket.value) {
    // Re-setup WebSocket handlers after reconnection
    setupWebSocketHandlers();
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

const savePassword = (deviceId, pwd) => {
  if (rememberPassword.value) {
    try {
      const savedPasswords = JSON.parse(
        localStorage.getItem('devicePasswords') || '{}'
      );
      savedPasswords[deviceId] = pwd;
      localStorage.setItem('devicePasswords', JSON.stringify(savedPasswords));
    } catch (error) {
      console.error('Failed to save password:', error);
    }
  }
};

const getSavedPassword = (deviceId) => {
  try {
    const savedPasswords = JSON.parse(
      localStorage.getItem('devicePasswords') || '{}'
    );
    return savedPasswords[deviceId] || '';
  } catch (error) {
    console.error('Failed to get saved password:', error);
    return '';
  }
};

const attemptConnection = async () => {
  const deviceId = route.params.deviceId;
  if (!deviceId || !password.value) {
    showModalError('Device ID and password are required.');
    return;
  }

  const success = await connectToDevice(deviceId, password.value);
  if (!success) {
    disconnect();
    return;
  }

  // Save password if connection successful
  savePassword(deviceId, password.value);

  // Enable input devices based on user preferences
  if (enableMouseOnConnect.value && !mouseEnabled.value) {
    toggleMouse();
  }
  if (enableKeyboardOnConnect.value && !keyboardEnabled.value) {
    toggleKeyboard();
  }
};

const handleDisconnect = () => {
  disconnect();
  redirectToDevices();
};

const redirectToDevices = () => {
  if (!isEmbedMode.value) {
    router.push({
      path: '/devices',
      query: {}
    });
  }
};

const setupWebSocketHandlers = () => {
  if (!websocket.value) return;

  websocket.value.onmessage = async (event) => {
    const signal = JSON.parse(event.data);

    if (signal.type === 'join_declined') {
      showModalError('Join declined: ' + signal.reason);
    } else if (signal.type === 'offer') {
      await handleServerMessage(signal);
      isConnected.value = true;
      showPasswordModal.value = false;

      // Initialize video and audio tracks
      if (videoStream.value) {
        initVideoTrack(videoStream.value);
      }
      if (audioStream.value) {
        await initAudioTrack(audioStream.value);
      }
    } else if (signal.type === 'server_closed') {
      showModalError('The device is currently offline.');
      redirectToDevices();
    } else {
      await handleServerMessage(signal);
    }
  };
};

// Initialize LiveKit connection
const initializeLiveKit = async () => {
  try {
    if (!livekitRoom.value) {
      // Get username from userData in localStorage
      let userData;
      try {
        userData = JSON.parse(localStorage.getItem('userData') || '{}');
      } catch {
        userData = {};
      }

      // Connect to LiveKit with device ID as room name (with full permissions)
      const roomName = `${deviceId.value}`;
      const room = await connectToLiveKit(roomName, userData);
      livekitRoom.value = room;
    }
  } catch {
    // Retry connection after a delay
    setTimeout(initializeLiveKit, 5000);
  }
};

// Toggle LiveKit chat visibility
const toggleChat = () => {
  showChat.value = !showChat.value;
  if (showChat.value) {
    // Reset unread count when opening chat
    unreadMessageCount.value = 0;
  }
};

// Toggle LiveKit call visibility
const toggleCall = () => {
  showCall.value = !showCall.value;
};

// Handle unread messages
const handleUnreadMessage = () => {
  if (!showChat.value) {
    unreadMessageCount.value++;
  }
};

// Initialize connections
onMounted(async () => {
  // Initialize user data using the shared function
  initializeUserData();

  // Initialize connections with guaranteed userData
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
      await waitForConnection();
      await attemptConnection();
    } else {
      // Check for saved password
      const savedPassword = getSavedPassword(route.params.deviceId);
      if (savedPassword) {
        password.value = savedPassword;
        await waitForConnection();
        await attemptConnection();
      } else {
        showPasswordModal.value = true;
      }
    }

    setupWebSocketHandlers();
  }

  // Initialize LiveKit chat connection when device connection is established
  watch(isConnected, async (newIsConnected) => {
    if (newIsConnected) {
      await initializeLiveKit();
    }
  });

  // Store the interval ID for cleanup
  onUnmounted(() => {
    clearInterval(fpsInterval);
    cleanupMouse();
    cleanupKeyboard();
    cleanupJoystick();
    cleanupVideo();
    cleanupAudio();
    disconnect();

    // Clean up LiveKit resources
    if (livekitRoom.value) {
      disconnectFromLiveKit();
      livekitRoom.value = null;
    }
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
