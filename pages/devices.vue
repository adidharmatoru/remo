<template>
  <div class="min-h-screen bg-canvas-subtle pb-12 pt-12">
    <div class="container mx-auto px-8">
      <h1 class="mb-10 text-3xl font-bold text-high-contrast">
        Available Devices
      </h1>

      <!-- Device Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <template v-if="isLoading">
          <!-- Shimmer Loading Placeholder -->
          <div
            v-for="n in loadingCardCount"
            :key="n"
            class="group relative overflow-hidden rounded-xl border border-border-default bg-canvas-default shadow-sm animate-pulse"
          >
            <div class="p-6">
              <div class="mb-4 flex justify-center">
                <div
                  class="h-40 w-40 rounded-full bg-gray-200 dark:bg-slate-700"
                ></div>
              </div>
              <div class="mt-4 space-y-3">
                <div
                  class="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700"
                ></div>
                <div
                  class="h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-700"
                ></div>
              </div>
            </div>
            <div class="border-t border-border-default bg-canvas-subtle p-4">
              <div class="space-y-2">
                <div
                  class="h-4 w-full rounded bg-gray-200 dark:bg-slate-700"
                ></div>
                <div
                  class="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700"
                ></div>
              </div>
            </div>
            <div class="border-t border-border-default bg-canvas-default p-4">
              <div
                class="h-8 w-full rounded bg-gray-200 dark:bg-slate-700"
              ></div>
            </div>
          </div>
        </template>

        <template v-else>
          <!-- Actual Device Cards -->
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
                  <Icon
                    :name="getDeviceIcon(device.os)"
                    class="h-full w-full"
                  />
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

              <!-- Viewer Count -->
              <div class="mt-2 flex items-center">
                <Icon
                  name="lucide:users"
                  class="mr-1 h-4 w-4 text-high-contrast"
                />
                <span class="text-sm text-default"
                  >{{ device.viewerCount }} connected</span
                >
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
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

/*global webSocket*/
const { websocket, sendMessageOnConnection } = webSocket(false);

// Reactive list of devices
const devices = ref([]);
const isLoading = ref(true);
const loadingCardCount = ref(3);

// Mock devices data
const mockDevices = [
  {
    id: 'TEST2',
    name: 'Laptop',
    os: 'macOS',
    version: '0.0.1',
    online: false,
    viewerCount: 0
  },
  {
    id: 'TEST3',
    name: 'Server',
    os: 'Linux',
    version: '0.0.1b',
    online: false,
    viewerCount: 0
  }
];

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

// Function to populate devices
const populateDevices = (data) => {
  const updatedDevices = Object.keys(data).map((room) => ({
    id: data[room].server,
    name: data[room].name,
    viewerCount: data[room].viewer_count,
    os: data[room].os,
    version: data[room].version,
    online: true
  }));

  // Combine updated devices with mock devices
  devices.value = [...updatedDevices, ...mockDevices];
  isLoading.value = false;
};

const refreshDevices = () => {
  setInterval(() => {
    sendMessageOnConnection({ type: 'get_room_list' });
  }, 5000);
};

onMounted(async () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (Object.keys(userData).length === 0) {
    router.push('/');
  }

  // Send the get_room_list message
  await sendMessageOnConnection({ type: 'get_room_list' });
  refreshDevices();

  // Listen for updates
  websocket.value.onmessage = (event) => {
    const signal = JSON.parse(event.data);
    if (signal.type === 'room_list_response') {
      populateDevices(signal.rooms);
    }
  };
});
</script>
