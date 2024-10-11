<template>
  <div class="min-h-screen bg-canvas-subtle pb-12 pt-12">
    <FloatingMenu />
    <div class="container mx-auto px-8">
      <h1 class="mb-10 text-3xl font-bold text-high-contrast">
        Available Devices
      </h1>

      <!-- Device Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="device in devices"
          :key="device.id"
          class="group relative cursor-pointer overflow-hidden rounded-xl border border-border-default bg-canvas-default shadow-sm transition-all hover:border-accent-emphasis hover:shadow-lg"
          @click="selectDevice(device)"
        >
          <!-- Main Card Content -->
          <div class="p-6">
            <div class="mb-4 flex justify-center">
              <div
                class="h-40 w-40 text-accent-fg opacity-90 transition-transform group-hover:scale-110"
              >
                <Icon :name="getDeviceIcon(device.os)" class="h-full w-full" />
              </div>
            </div>

            <div class="mt-4 flex items-end justify-between">
              <h2 class="text-lg font-semibold text-high-contrast">
                {{ device.name }}
              </h2>
              <span
                class="rounded-full px-3 py-1 text-xs font-medium"
                :class="getStatusClass(device.online)"
              >
                {{ device.online ? 'Online' : 'Offline' }}
              </span>
            </div>
          </div>

          <!-- Device Details -->
          <div
            class="border-t border-border-default bg-canvas-subtle px-6 py-4"
          >
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-default">App Version</span>
                <span class="text-high-contrast">{{ device.version }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-default">Operating System</span>
                <span class="text-high-contrast">{{ device.os }}</span>
              </div>
            </div>
          </div>

          <!-- Connect Button -->
          <div class="border-t border-border-default bg-canvas-default p-4">
            <button
              class="flex w-full items-center justify-center rounded-lg bg-accent-emphasis py-2 transition-all hover:bg-accent-emphasis/90"
              :class="device.online ? '' : 'cursor-not-allowed opacity-50'"
              :disabled="!device.online"
            >
              <Icon name="heroicons:link-20-solid" class="mr-2 h-4 w-4" />
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Mock devices data
const devices = ref([
  {
    id: 'TEST',
    name: 'Gaming PC',
    os: 'Windows',
    version: '0.1.0',
    online: true
  },
  {
    id: 'TEST2',
    name: 'Laptop',
    os: 'macOS',
    version: '0.0.1',
    online: false
  },
  {
    id: 'TEST3',
    name: 'Server',
    os: 'Linux',
    version: '0.0.1b',
    online: false
  }
]);

const getStatusClass = (online) => {
  return online
    ? 'bg-success-subtle text-success-fg'
    : 'bg-danger-subtle text-danger-fg';
};

const getDeviceIcon = (os) => {
  switch (os.toLowerCase()) {
    case 'windows':
      return 'ri:windows-fill';
    case 'macos':
      return 'ri:apple-fill';
    case 'linux':
      return 'ri:ubuntu-fill';
    default:
      return 'ri:computer-line';
  }
};

const selectDevice = (device) => {
  if (device.online) {
    router.push({
      path: '/stream',
      query: { deviceId: device.id }
    });
  }
};

/*global onMounted*/
onMounted(() => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (Object.keys(userData).length === 0) {
    router.push('/');
  }
});
</script>
