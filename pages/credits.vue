<template>
  <div class="min-h-screen bg-canvas-subtle pb-12 pt-12">
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h1
            class="text-4xl font-bold tracking-tight text-high-contrast sm:text-6xl"
          >
            Credits & Roadmap
          </h1>
          <p class="mt-6 text-lg leading-8 text-default">
            Made possible by
            <a href="https://www.rust-lang.org/" class="text-accent-fg">RUST</a>
            +
            <a href="https://nuxt.com/" class="text-accent-fg">NUXT</a>
            and these awesome technologies.
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-7xl px-6 py-6 lg:px-8">
      <!-- Credits Section -->
      <div class="mb-24">
        <h2 class="mb-12 text-3xl font-bold text-high-contrast">
          Technologies & Credits
        </h2>
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="tech in technologies"
            :key="tech.name"
            class="group relative rounded-xl border border-border-default bg-canvas-default p-6 shadow-sm transition-all hover:border-accent-emphasis hover:shadow-lg"
          >
            <div class="flex items-center gap-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle"
              >
                <component :is="tech.icon" class="h-6 w-6 text-accent-fg" />
              </div>
              <h3 class="text-xl font-semibold text-high-contrast">
                {{ tech.name }}
              </h3>
            </div>
            <p class="mt-4 text-default" v-html="tech.description" />
          </div>
        </div>
      </div>

      <!-- Improved Milestones Section -->
      <div>
        <h2 class="mb-12 text-3xl font-bold text-high-contrast">
          Roadmap & Milestones
        </h2>
        <div class="space-y-16">
          <div
            v-for="milestone in milestones"
            :key="milestone.date"
            class="relative"
          >
            <div class="flex flex-col gap-8 lg:flex-row lg:gap-16">
              <!-- Date and Status -->
              <div class="lg:w-1/4">
                <div class="sticky top-8">
                  <time class="mb-2 block text-sm font-semibold text-accent-fg">
                    {{ milestone.date }}
                  </time>
                  <span
                    :class="`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
                        ${
                          milestone.status === 'Completed'
                            ? 'bg-success-subtle text-success-fg'
                            : milestone.status === 'In Progress'
                              ? 'bg-accent-subtle text-accent-fg'
                              : 'bg-neutral-subtle text-default'
                        }`"
                  >
                    {{ milestone.status }}
                  </span>
                </div>
              </div>

              <!-- Content -->
              <div class="lg:w-3/4">
                <div
                  class="rounded-xl border border-border-default bg-canvas-default p-8"
                >
                  <h3 class="text-2xl font-bold text-high-contrast text-center">
                    {{ milestone.title }}
                  </h3>
                  <p class="mt-4 text-default text-center">
                    {{ milestone.description }}
                  </p>

                  <!-- Features Grid -->
                  <div
                    v-if="milestone.features && milestone.features.length > 0"
                    class="mt-8 grid gap-4 sm:grid-cols-2"
                  >
                    <div
                      v-for="feature in milestone.features"
                      :key="feature.name"
                      class="grid grid-cols-[auto_1fr] items-start gap-3"
                      :class="{
                        'justify-center': milestone.features.length === 1
                      }"
                    >
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle"
                      >
                        <component
                          :is="feature.icon"
                          class="h-4 w-4 text-accent-fg"
                        />
                      </div>
                      <div>
                        <h4
                          class="font-medium text-high-contrast"
                          v-html="feature.name"
                        ></h4>
                        <p
                          class="text-sm text-default"
                          v-html="feature.description"
                        ></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Demos Section -->
      <div class="mt-24">
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
            <video class="mt-4 overflow-hidden rounded-lg" controls playsinline>
              <source :src="demo.videoSrc" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Cpu,
  Globe,
  Lock,
  Zap,
  Video,
  Users,
  Joystick,
  FileVideo2,
  Monitor,
  Target
} from 'lucide-vue-next';

const demos = [
  {
    title: 'Productivity',
    description:
      'Check out how the hardware-accelerated streaming makes remote work and learning a breeze!',
    videoSrc: 'https://s3.adidharmatoru.dev/dev/uploads/videos/demos/code.mov'
  },
  {
    title: 'Watch Party',
    description:
      'Join the fun with friends and enjoy and control live streams together, all with smooth performance!',
    videoSrc: 'https://s3.adidharmatoru.dev/dev/uploads/videos/demos/watch.mov'
  },
  {
    title: '3D / FPS Games',
    description:
      'Jump into the action and see Remo makes 3D and FPS gaming super smooth and interactive!',
    videoSrc: 'https://s3.adidharmatoru.dev/dev/uploads/videos/demos/fps.mov'
  },
  {
    title: 'MOBA / RTS Games',
    description:
      'Dive into the strategies of MOBAs and RTS games with minimal lag for an awesome experience!',
    videoSrc: 'https://s3.adidharmatoru.dev/dev/uploads/videos/demos/moba.mov'
  }
];

const technologies = [
  {
    name: 'Windows Graphic Capture',
    icon: Cpu,
    description:
      "Harnesses GPU capabilities for efficient video capture and encoding. <a href='https://github.com/robmikh/screenshot-rs'>screenshot-rs</a>, <a href='https://github.com/enigo-rs/enigo'>enigo</a>"
  },
  {
    name: 'WebRTC',
    icon: Globe,
    description:
      'Facilitates fast, low-latency connections through a network of distributed servers worldwide.'
  },
  {
    name: 'End-to-End Encryption',
    icon: Lock,
    description:
      'Utilizes advanced encryption protocols for secure remote communications.'
  },
  {
    name: 'Hardware Acceleration',
    icon: Zap,
    description:
      'Enhances video streaming quality with optimized rendering and codec technologies.'
  },
  {
    name: 'Cross-Device Compatibility',
    icon: Monitor,
    description:
      'Available on any device with internet access through a web browser.'
  },
  {
    name: 'Multi-User Support',
    icon: Users,
    description:
      'Allows multiple users to efficiently control a single device simultaneously.'
  }
];

const milestones = [
  {
    date: '~ Q3 2024',
    status: 'Completed',
    title: 'Demo Release',
    description:
      'Launch of demo remote desktop functionality with hardware acceleration.',
    features: [
      {
        name: 'Hardware Acceleration',
        description: 'High-performance graphics rendering',
        icon: Video
      },
      {
        name: 'Multi-User Sessions',
        description: 'Collaborative remote access',
        icon: Users
      }
    ]
  },
  {
    date: 'Q4 2024 ~ Q1 2025',
    status: 'In Progress',
    title: 'Enhanced Demo Functionality',
    description: 'Introduction of new features and improvements.',
    features: [
      {
        name: 'Multi Joystick Controller Support',
        description: 'Connect to multiple joystick from each session',
        icon: Joystick
      },
      {
        name: 'Multi Monitor Support',
        description: 'Switch monitor at ease',
        icon: Monitor
      }
    ]
  },
  {
    date: 'Q2 2025 ~ Q3 2025',
    status: 'Planned',
    title: 'Alpha Public Release',
    description:
      'Launch of first release (portable executable file) for public test.',
    features: [
      {
        name: "Early <a href='https://quic.video/'>Media Over QUIC</a> R&D?",
        description:
          'Use a new protocol to transmit data that is theoretically faster and smoother.',
        icon: FileVideo2
      }
    ]
  },
  {
    date: 'Q4 2025 ~',
    status: 'Planned',
    title: 'Enterprise Features or Open Sourcing',
    description:
      'Advanced features for large-scale deployments and geo-destributions.',
    features: [
      {
        name: 'Enterprise vs Open Source',
        description: 'Choose route from here',
        icon: Target
      }
    ]
  }
];
</script>
