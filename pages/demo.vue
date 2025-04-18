<template>
  <div class="min-h-screen bg-canvas-subtle pb-12 pt-12">
    <!-- Hero Section -->
    <div class="container mx-auto px-4 sm:px-6 text-center">
      <h1
        class="mb-8 text-4xl font-bold tracking-tight text-high-contrast sm:text-6xl"
      >
        Remo - Public Demo
      </h1>
      <p class="mt-6 text-lg leading-8 text-default max-w-2xl mx-auto">
        Hardware-Accelerated Remote Desktop <br />
        Connect to your device - anywhere
      </p>
      <div class="flex flex-col sm:flex-row justify-center gap-4 mt-8">
        <button
          @click="showVideo = true"
          class="flex items-center justify-center rounded-lg bg-accent-emphasis px-6 py-3 text-high-contrast hover:opacity-90"
        >
          <Icon name="ph:play-fill" class="mr-2 h-5 w-5" />
          Watch Demo
        </button>
        <a
          href="https://github.com/adidharmatoru/remo"
          target="_blank"
          class="flex items-center text-high-contrast hover:opacity-90 justify-center rounded-lg border border-border-default bg-canvas-default px-6 py-3 text-default"
        >
          <Icon name="mdi:github" class="mr-2 h-5 w-5" />
          View on GitHub
        </a>
      </div>
    </div>

    <!-- Video Popup -->
    <div
      v-if="showVideo"
      @click.self="showVideo = false"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="relative w-full max-w-4xl rounded-lg p-4">
        <video controls class="w-full" preload="metadata">
          <source :src="videoSrc + '#t=0.1'" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>

    <!-- Actual Device Cards -->
    <div
      class="group relative cursor-pointer overflow-hidden rounded-xl border border-border-default bg-canvas-default shadow-sm transition-all hover:border-accent-emphasis hover:shadow-lg mx-auto max-w-sm mt-16"
    >
      <!-- Main Card Content -->
      <div class="p-6">
        <div class="mb-4 flex justify-center">
          <div
            class="h-40 w-40 text-accent-fg opacity-90 transition-transform group-hover:scale-110"
          >
            <Icon name="ri:windows-fill" class="h-full w-full" />
          </div>
        </div>

        <div class="mt-4 flex items-end justify-between">
          <h2 class="text-lg font-semibold text-high-contrast">
            Your Device Name
          </h2>
          <span
            class="rounded-full px-3 py-1 text-xs font-medium bg-success-subtle text-success-fg"
          >
            Online
          </span>
        </div>

        <!-- Viewer Count -->
        <div class="mt-2 flex items-center justify-between">
          <div class="flex items-center">
            <Icon name="lucide:users" class="mr-1 h-4 w-4 text-high-contrast" />
            <span class="text-sm text-default">0 connected</span>
          </div>
          <div class="flex items-center space-x-2">
            <Icon
              name="heroicons:check-circle"
              class="w-5 h-5 text-green-500"
            />
            <span class="text-sm text-green-600 dark:text-green-400">
              Control
            </span>
          </div>
        </div>
      </div>

      <!-- Device Details -->
      <div class="border-t border-border-default bg-canvas-subtle px-6 py-4">
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-default">App Version</span>
            <span class="text-high-contrast">public demo</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-default">Operating System</span>
            <span class="text-high-contrast">Windows</span>
          </div>
        </div>
      </div>

      <!-- Connect Button -->
      <div class="border-t border-border-default bg-canvas-default p-4">
        <button
          class="flex w-full items-center justify-center rounded-lg bg-accent-emphasis py-2 transition-all hover:bg-accent-emphasis/90"
        >
          <Icon name="heroicons:link-20-solid" class="mr-2 h-4 w-4" />
          Connect
        </button>
      </div>
    </div>

    <!-- Features Section -->
    <div class="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <h2
        class="mb-8 sm:mb-12 text-center text-3xl font-bold text-high-contrast"
      >
        Key Features
      </h2>
      <div class="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="group relative rounded-xl border border-border-default bg-canvas-default p-6 shadow-sm transition-all hover:border-accent-emphasis hover:shadow-lg"
        >
          <div
            class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle"
          >
            <Icon :name="feature.icon" class="h-6 w-6 text-accent-fg" />
          </div>
          <h3 class="mb-3 text-xl font-semibold text-high-contrast">
            {{ feature.title }}
          </h3>
          <p class="text-default">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Steps Section -->
    <div class="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <h2
        class="mb-8 sm:mb-12 text-center text-3xl font-bold text-high-contrast"
      >
        How It Works
      </h2>
      <div class="relative">
        <!-- Timeline line - hidden on mobile -->
        <div
          class="absolute left-1/2 h-full w-1 -translate-x-1/2 bg-accent-subtle hidden md:block"
        ></div>

        <div class="space-y-8 sm:space-y-12">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="relative md:flex md:items-center"
          >
            <!-- Mobile layout -->
            <div class="md:hidden mb-8">
              <div
                class="rounded-xl border border-border-default bg-canvas-default p-6 shadow-sm"
              >
                <div class="flex items-center mb-4">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-accent-emphasis text-high-contrast mr-4"
                  >
                    {{ index + 1 }}
                  </div>
                  <h3 class="text-xl font-semibold text-high-contrast">
                    {{ step.title }}
                  </h3>
                </div>
                <p class="mb-2 text-default">
                  {{ step.description }}
                </p>
                <span class="text-sm text-accent-fg">
                  {{ step.status }}
                </span>
              </div>
            </div>

            <!-- Desktop layout -->
            <div class="hidden md:flex items-center justify-between w-full">
              <div v-if="index % 2 === 0" class="w-7/12"></div>
              <div
                :class="[
                  'w-5/12',
                  index % 2 === 0 ? 'order-1' : 'order-2 text-right'
                ]"
              >
                <div
                  class="rounded-xl border border-border-default bg-canvas-default p-6 shadow-sm"
                >
                  <h3 class="mb-3 text-xl font-semibold text-high-contrast">
                    {{ step.title }}
                  </h3>
                  <p class="mb-2 text-default">
                    {{ step.description }}
                  </p>
                  <span class="text-sm text-accent-fg">
                    {{ step.status }}
                  </span>
                </div>
              </div>
              <div
                class="absolute left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-accent-emphasis text-high-contrast"
              >
                {{ index + 1 }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Demos Section -->
    <div class="mt-8 p-4">
      <h2 class="mb-12 text-center text-4xl font-bold text-high-contrast">
        Demos
      </h2>
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
        <div
          v-for="demo in demos"
          :key="demo.title"
          class="flex flex-col rounded-xl border border-border-default bg-canvas-default p-6 shadow-lg transition-transform hover:scale-1"
        >
          <h3 class="text-2xl font-semibold text-high-contrast">
            {{ demo.title }}
          </h3>
          <p class="mt-2 flex-grow text-default">{{ demo.description }}</p>

          <!-- YouTube Embed -->
          <div
            v-if="demo.isYoutubeEmbed"
            class="mt-4 overflow-hidden rounded-lg"
            style="aspect-ratio: 16/9"
          >
            <iframe
              class="w-full h-full"
              :src="`https://www.youtube.com/embed/${demo.youtubeId}?autoplay=0&controls=1&rel=0`"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            >
            </iframe>
          </div>

          <!-- Twitch Embed -->
          <div
            v-else-if="demo.isTwitchEmbed"
            class="mt-4 overflow-hidden rounded-lg"
            style="aspect-ratio: 16/9"
          >
            <iframe
              class="w-full h-full"
              :src="`https://player.twitch.tv/?video=${demo.twitchVideoId}&parent=${domainName}&autoplay=false`"
              frameborder="0"
              scrolling="no"
              allowfullscreen="true"
            >
            </iframe>
          </div>

          <!-- Regular Video -->
          <video
            v-else
            class="mt-4 overflow-hidden rounded-lg"
            controls
            playsinline
            preload="metadata"
          >
            <source :src="demo.videoSrc + '#t=0.1'" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div
        class="rounded-2xl bg-accent-emphasis px-6 sm:px-8 py-12 text-center"
      >
        <h2 class="mb-4 text-3xl font-bold text-high-contrast">
          Ready to Get Started?
        </h2>
        <p class="mb-8 text-lg text-default max-w-2xl mx-auto">
          This demo release is intended for testing and feedback purposes.
        </p>
        <div class="flex justify-center">
          <a
            href="https://github.com/adidharmatoru/remo-windows/releases/download/demo/remo.zip"
            download
            class="inline-flex items-center border border-border-default rounded-lg bg-canvas-default px-6 py-3 text-high-contrast hover:opacity-90 shadow-sm"
          >
            Try Demo Now
            <Icon name="ph:arrow-right-bold" class="ml-2 h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

/*global defineOgImageComponent*/
defineOgImageComponent('Remo', {
  headline: 'Demo',
  title: 'Try Remo 🙌',
  description: 'Download the limited demo and try it out for yourself!',
  colorMode: 'light'
});

const showVideo = ref(false);
const videoSrc = ref(
  'https://cdn.adidharmatoru.dev/dev/uploads/videos/demos/demo.mp4'
);

const domain = ref('');

onMounted(() => {
  domain.value = window.location.hostname;
});

const domainName = computed(() => {
  return domain.value || 'localhost';
});

const demos = [
  {
    title: 'Productivity',
    description:
      'Check out how the hardware-accelerated streaming makes remote work and learning a breeze!',
    videoSrc: 'https://cdn.adidharmatoru.dev/dev/uploads/videos/demos/code.mp4'
  },
  {
    title: 'Watch Party',
    description:
      'Join the fun with friends and enjoy and control live streams together, all with smooth performance!',
    videoSrc: 'https://cdn.adidharmatoru.dev/dev/uploads/videos/demos/watch.mp4'
  },
  {
    title: '3D / FPS Games',
    description:
      'Jump into the action and see Remo makes 3D and FPS gaming super smooth and interactive!',
    videoSrc: 'https://cdn.adidharmatoru.dev/dev/uploads/videos/demos/fps.mp4'
  },
  {
    title: 'MOBA / RTS Games',
    description:
      'Dive into the strategies of MOBAs and RTS games with minimal lag for an awesome experience!',
    videoSrc: 'https://cdn.adidharmatoru.dev/dev/uploads/videos/demos/moba.mp4'
  },
  {
    title: 'Mobile Gaming',
    description:
      "Experience smooth mobile gaming with Remo's hardware acceleration - perfect for playing on the go!",
    isYoutubeEmbed: true,
    youtubeId: 'BKhFIZDeOLg'
  },
  {
    title: 'Live Streaming',
    description:
      "Stream your gameplay with friends and viewers from any device using Remo's low-latency connection!",
    isTwitchEmbed: true,
    twitchVideoId: '2342927439'
  }
];

const features = [
  {
    title: 'Low Latency',
    description:
      'Experience ultra-fast remote desktop performance with minimal input delay, ideal for graphics-intensive tasks, software development, and general productivity.',
    icon: 'ph:computer-tower-bold'
  },
  {
    title: 'Hardware Acceleration',
    description:
      'Enjoy fast, high-quality visuals even with low bandwidth, thanks to advanced compression algorithms.',
    icon: 'ph:shield-check-bold'
  },
  {
    title: 'Real-time Collaboration',
    description:
      'Multiple viewers can connect simultaneously with live viewer count tracking.',
    icon: 'ph:users-three-bold'
  }
];

const steps = [
  {
    title: 'Download the Public Demo',
    description: 'Click on the try demo now button below to get started',
    status: 'Watch the video for the full demo'
  },
  {
    title: 'Unzip the Files',
    description: 'Unzip the downloaded files into a folder',
    status: 'No installation is needed'
  },
  {
    title: 'Start Remote Session',
    description:
      'Once unzipped, simply run the .exe file to start your session',
    status: 'Zero configuration required'
  },
  {
    title: 'Connect to a Remote Desktop',
    description:
      'Ctrl+Click the join link or scan the join link QR code to connect',
    status: 'The public demo currently only avaiable for lan'
  }
];
</script>
