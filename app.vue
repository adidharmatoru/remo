<script setup>
import { useRoute } from 'vue-router';
import { ref, watch, computed, onUnmounted } from 'vue';

const route = useRoute();
/*global webSocket*/
const { isOnline } = webSocket(true);

const showHeaderFooter = computed(() => {
  return !['index', 'stream-deviceId'].includes(route.name);
});

// Track connection status
const connectionStatus = ref('offline');
const statusBackgroundColor = ref('bg-red-500');
const hideTimeout = ref(null);

// Watch for changes in isOnline
watch(isOnline, (newIsOnline) => {
  // Clear any existing hide timeout
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value);
    hideTimeout.value = null;
  }

  // Always show the indicator first
  connectionStatus.value = newIsOnline ? 'connected' : 'offline';
  statusBackgroundColor.value = newIsOnline ? 'bg-green-500' : 'bg-red-500';

  // Only set hide timeout for connected state
  if (newIsOnline) {
    hideTimeout.value = setTimeout(() => {
      connectionStatus.value = 'hide';
    }, 1000);
  }
});

// Clean up timeout on component unmount
onUnmounted(() => {
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value);
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <transition
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 translate-x-full scale-95"
      enter-to-class="opacity-100 translate-x-0 scale-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 translate-x-0 scale-100"
      leave-to-class="opacity-0 translate-x-full scale-95"
    >
      <div
        v-if="connectionStatus !== 'hide'"
        :class="[
          statusBackgroundColor,
          'connection-status-indicator text-white backdrop-blur-md backdrop-saturate-150 p-4 fixed rounded-xl shadow-2xl z-50 flex items-center gap-3'
        ]"
      >
        <div
          class="status-icon"
          :class="{
            'animate-pulse': connectionStatus === 'offline',
            'animate-success': connectionStatus === 'connected'
          }"
        ></div>
        <span class="font-medium tracking-wide">
          {{
            connectionStatus === 'offline'
              ? 'Reconnecting to server...'
              : 'Connected successfully'
          }}
        </span>
      </div>
    </transition>

    <Header v-if="showHeaderFooter" />

    <main class="flex-grow">
      <NuxtLoadingIndicator />
      <NuxtPage />
    </main>

    <Footer v-if="showHeaderFooter" />
  </div>
</template>

<style lang="postcss">
:root {
  --color-canvas-default: #ffffff;
  --color-canvas-subtle: #fcfcfc;
  --color-border-default: #d0d7de;
  --color-border-muted: #d8dee4;
  --color-neutral-muted: rgba(175, 184, 193, 0.2);
  --color-accent-fg: #22c55e;
  --color-accent-emphasis: #22c55e;
  --color-header-bg: #ffffff;
  --color-header-border: #d0d7de;
  --color-fg-default: #0b0d0e;
  --color-fg-muted: #57606a;
  --color-fg-subtle: #6e7781;
  --color-canvas-overlay: #ffffff;
  --color-canvas-inset: #f6f8fa;
  --color-code-bg: #f6f8fa;
  --color-code-fg: #032f62;
  --color-success-subtle: #dafbe1;
  --color-success-fg: #1a7f37;
  --color-danger-subtle: #ffebe9;
  --color-danger-fg: #cf222e;
  --color-accent-subtle: rgba(82, 83, 83, 0.15);
  --color-neutral-subtle: #f6f8fa;
  --color-success-subtle: #dafbe1;
  --color-success-fg: #1a7f37;
  --color-canvas-overlay: #ffffff;
  --color-danger-fg: #cf222e;

  /* Scrollbar colors for light mode */
  --scrollbar-thumb: rgba(0, 0, 0, 0.2);
  --scrollbar-track: rgba(0, 0, 0, 0.05);
}

.dark-mode {
  --color-canvas-default: #0d1117;
  --color-canvas-subtle: #161b22;
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-neutral-muted: rgba(110, 118, 129, 0.4);
  --color-accent-fg: #22c55e;
  --color-accent-emphasis: #22c55e;
  --color-header-bg: #0d1117;
  --color-header-border: #21262d;
  --color-fg-default: #c9d1d9;
  --color-fg-muted: #8b949e;
  --color-fg-subtle: #6e7681;
  --color-canvas-overlay: #161b22;
  --color-canvas-inset: #010409;
  --color-code-bg: #161b22;
  --color-code-fg: #c9d1d9;
  --color-success-subtle: rgba(46, 160, 67, 0.15);
  --color-success-fg: #3fb950;
  --color-danger-subtle: rgba(248, 81, 73, 0.15);
  --color-danger-fg: #f85149;
  --color-accent-subtle: rgba(56, 139, 253, 0.15);
  --color-neutral-subtle: rgba(110, 118, 129, 0.1);
  --color-success-subtle: rgba(46, 160, 67, 0.15);
  --color-success-fg: #3fb950;
  --color-canvas-overlay: #161b22;
  --color-danger-fg: #f85149;

  /* Scrollbar colors for dark mode */
  --scrollbar-thumb: rgba(255, 255, 255, 0.2);
  --scrollbar-track: rgba(255, 255, 255, 0.05);
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--color-canvas-default);
  color: var(--color-fg-default);
  transition: background-color 0.3s;
}

a {
  color: var(--color-accent-fg);
  text-decoration: none;
}

.bg-header {
  background-color: var(--color-header-bg);
}

.border-header-border {
  border-color: var(--color-header-border);
}

.text-high-contrast {
  color: var(--color-fg-default) !important;
}

.text-default {
  color: var(--color-fg-muted);
}

/* Custom scrollbar styles */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-fg);
}

/* For Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
.transition-all {
  transition-property: all;
}

.connection-status-indicator {
  bottom: 24px;
  right: 24px;
  max-width: 300px;
  font-size: 0.875rem;
  line-height: 1.25rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.connection-status-indicator.bg-red-500 {
  background: rgba(239, 68, 68, 0.85);
}

.connection-status-indicator.bg-green-500 {
  background: rgba(34, 197, 94, 0.85);
}

.status-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
  transition: all 0.3s ease;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.9);
  }
}

@keyframes success {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-success {
  animation: success 0.6s cubic-bezier(0.4, 0, 0.6, 1);
}

.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none; /* Prevents callout menu on iOS */
}
</style>
