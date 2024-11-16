<script setup>
import { useRoute } from 'vue-router';
import { ref, watch, computed } from 'vue';

const route = useRoute();
/*global webSocket*/
const { isOnline } = webSocket(true);

const title = ref('Remo');
const description = ref('Hardware Accelerated Remote Desktop');
const lang = 'en';

// Update title based on the route's meta
watch(route, () => {
  title.value = route.meta.title || 'Remo';
  description.value =
    route.meta.description || 'Hardware Accelerated Remote Desktop';
});

// Set SEO metadata
/*global useSeoMeta*/
useSeoMeta({
  title: title,
  lang: lang,
  description: description
});

const showHeaderFooter = computed(() => {
  return !['index', 'stream'].includes(route.name);
});

// Track connection status
const connectionStatus = ref('offline');
const statusBackgroundColor = ref('bg-red-500');

// Watch for changes in isOnline
watch(isOnline, (newIsOnline) => {
  if (newIsOnline) {
    connectionStatus.value = 'connected';
    statusBackgroundColor.value = 'bg-green-500';
    // Trigger the transition to hide after a delay
    setTimeout(() => {
      connectionStatus.value = 'hide';
    }, 1000);
  } else {
    connectionStatus.value = 'offline';
    statusBackgroundColor.value = 'bg-red-500';
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <transition
      enter-active-class="transition-all duration-300 ease-in-out"
      enter-from-class="opacity-0 -translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300 ease-in-out"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-full"
    >
      <div
        v-if="connectionStatus !== 'hide'"
        :class="[
          statusBackgroundColor,
          'text-white p-2 text-center fixed left-0 right-0 z-50',
          { 'top-16': isHeaderVisible, 'top-0': !isHeaderVisible }
        ]"
      >
        {{
          connectionStatus === 'offline'
            ? 'You are currently offline. Attempting to reconnect...'
            : 'Connected'
        }}
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
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
</style>
