<template>
  <div class="relative h-screen w-full overflow-hidden bg-black">
    <!-- Video Carousel Background -->
    <div class="absolute inset-0">
      <div
        v-for="(video, index) in videos"
        :key="index"
        class="absolute inset-0 transition-opacity duration-1000"
        :class="{
          'opacity-100': index === currentVideoIndex,
          'opacity-0': index !== currentVideoIndex
        }"
      >
        <video
          :src="video.url"
          class="h-full w-full object-cover"
          muted
          loop
          playsinline
          :ref="
            (el) => {
              if (el) videoRefs[index] = el;
            }
          "
        />
      </div>
    </div>

    <!-- Content Overlay -->
    <div class="relative z-10 flex h-full items-center justify-center">
      <div class="w-full max-w-lg px-6 text-center">
        <!-- Welcome Message -->
        <div
          v-if="savedName"
          class="mb-6 rounded-xl bg-bg-secondary/40 p-8 backdrop-blur"
        >
          <h1 class="mb-2 text-5xl font-bold text-white">
            Hi, {{ savedName }}
          </h1>
          <p class="text-lg text-white/80">
            Your next-gen remote desktop experience awaits
          </p>

          <!-- Connect Button -->
          <NuxtLink
            to="/devices"
            class="inline-flex items-center justify-center rounded-lg bg-color-primary px-8 py-4 text-lg text-white transition-all hover:bg-color-primary/90"
          >
            <span>Connect to Devices</span>
            <Icon name="heroicons:arrow-right" class="ml-2 h-5 w-5" />
          </NuxtLink>

          <!-- Demo Button -->
          <NuxtLink
            to="/demo"
            class="inline-flex items-center justify-center rounded-lg bg-color-primary px-8 text-xs text-white transition-all hover:bg-color-primary/90"
          >
            <span>Try the public demo now</span>
          </NuxtLink>

          <!-- Credits Button -->
          <NuxtLink
            to="/credits"
            class="inline-flex items-center justify-center rounded-lg bg-color-primary px-8 text-xs text-white transition-all hover:bg-color-primary/90"
          >
            <span>Credits and Roadmap</span>
          </NuxtLink>
        </div>

        <!-- Name Input -->
        <div
          v-else
          class="mb-6 rounded-xl bg-bg-secondary/40 p-8 backdrop-blur-sm"
        >
          <h1 class="mb-4 text-4xl font-bold text-white">
            Hardware Accelerated Remote Desktop
          </h1>
          <div class="relative">
            <input
              v-model="name"
              type="text"
              placeholder="Enter your name"
              class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm focus:border-color-primary focus:outline-none"
              @keyup.enter="saveName"
            />
            <button
              @click="saveName"
              class="absolute right-2 top-1/2 -translate-y-1/2 transform rounded-md bg-color-primary px-4 py-1 text-white transition-colors hover:bg-color-primary/90"
            >
              Start
            </button>
          </div>

          <!-- Demo Button -->
          <NuxtLink
            to="/demo"
            class="inline-flex items-center justify-center rounded-lg bg-color-primary px-8 text-xs text-white transition-all hover:bg-color-primary/90"
          >
            <span>Try the public demo now</span>
          </NuxtLink>

          <!-- Credits Button -->
          <NuxtLink
            to="/credits"
            class="inline-flex items-center justify-center rounded-lg bg-color-primary px-8 py-4 text-xs text-white transition-all hover:bg-color-primary/90"
          >
            <span>Credits and Roadmap</span>
          </NuxtLink>
        </div>

        <!-- Video Navigation -->
        <div class="mb-6 flex justify-center space-x-2">
          <button
            aria-label="currentVideoIndex"
            v-for="(video, index) in videos"
            :key="index"
            @click="currentVideoIndex = index"
            class="h-2 w-4 rounded-full transition-all"
            :class="
              index === currentVideoIndex
                ? 'bg-color-primary w-8'
                : 'bg-white/50 hover:bg-white/70'
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';

const name = ref('');
const savedName = ref('');
const currentVideoIndex = ref(0);
const videoRefs = ref([]);

const videos = [
  {
    url: 'https://cdn.adidharmatoru.dev/dev/uploads/videos/highlights-lite/code.mp4',
    title: 'Code'
  },
  {
    url: 'https://cdn.adidharmatoru.dev/dev/uploads/videos/highlights-lite/watch.mp4',
    title: 'Media Streaming'
  },
  {
    url: 'https://cdn.adidharmatoru.dev/dev/uploads/videos/highlights-lite/fps.mp4',
    title: 'FPS Game'
  },
  {
    url: 'https://cdn.adidharmatoru.dev/dev/uploads/videos/highlights-lite/moba.mp4',
    title: 'MOBA/RTS Game'
  }
];

// Add this watch effect to handle video playback
watch(currentVideoIndex, (newIndex, oldIndex) => {
  // Pause the previous video if it exists
  if (videoRefs.value[oldIndex]) {
    videoRefs.value[oldIndex].pause();
  }

  // Play the new current video
  if (videoRefs.value[newIndex]) {
    videoRefs.value[newIndex].play();
  }
});

const saveName = () => {
  if (name.value.trim()) {
    try {
      const userData = {
        name: name.value,
        id: uuidv4()
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      savedName.value = name.value;
    } catch (error) {
      console.error('Failed to save user data:', error);
      // Still set the name in memory even if localStorage fails
      savedName.value = name.value;
    }
  }
};

onMounted(() => {
  try {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.name) {
      savedName.value = userData.name;
    }
  } catch (error) {
    console.error('Failed to load user data:', error);
    // Continue without the saved data
  }

  // Play the first video immediately
  if (videoRefs.value[currentVideoIndex.value]) {
    videoRefs.value[currentVideoIndex.value].play();
  }

  setInterval(() => {
    currentVideoIndex.value = (currentVideoIndex.value + 1) % videos.length;
  }, 10000);
});
</script>
