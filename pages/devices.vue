<template>
  <div class="min-h-screen bg-canvas-subtle pb-12 pt-12">
    <div class="container mx-auto px-8">
      <h1 class="mb-10 text-3xl font-bold text-high-contrast">
        Available Devices
      </h1>

      <!-- Filters -->
      <div class="mb-8 rounded-lg bg-canvas-default p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-high-contrast">Filters</h2>
        <div class="space-y-4">
          <!-- Full-width name filter -->
          <div class="w-full">
            <label
              for="name-filter"
              class="mb-1 block text-sm font-medium text-fg-default"
              >Name</label
            >
            <input
              id="name-filter"
              v-model="filters.name"
              placeholder="Search by name"
              class="w-full rounded-md border border-border-default bg-canvas-default px-4 py-2 text-fg-default placeholder-fg-subtle focus:border-accent-emphasis focus:outline-none"
              @input="applyFilters"
            />
          </div>

          <!-- Other filters in one row -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                for="os-filter"
                class="mb-1 block text-sm font-medium text-fg-default"
                >Operating System</label
              >
              <select
                id="os-filter"
                v-model="filters.os"
                class="w-full rounded-md border border-border-default bg-canvas-default px-4 py-2 text-fg-default focus:border-accent-emphasis focus:outline-none appearance-none"
                @change="applyFilters"
              >
                <option value="">All OS</option>
                <option value="Windows">Windows</option>
                <option value="macOS">macOS</option>
                <option value="Linux">Linux</option>
              </select>
            </div>
            <div>
              <label
                for="version-filter"
                class="mb-1 block text-sm font-medium text-fg-default"
                >Version</label
              >
              <input
                id="version-filter"
                v-model="filters.version"
                placeholder="Filter by version"
                class="w-full rounded-md border border-border-default bg-canvas-default px-4 py-2 text-fg-default placeholder-fg-subtle focus:border-accent-emphasis focus:outline-none"
                @input="applyFilters"
              />
            </div>
            <div>
              <label
                for="control-filter"
                class="mb-1 block text-sm font-medium text-fg-default"
                >Control</label
              >
              <select
                id="control-filter"
                v-model="filters.control"
                class="w-full rounded-md border border-border-default bg-canvas-default px-4 py-2 text-fg-default focus:border-accent-emphasis focus:outline-none appearance-none"
                @change="applyFilters"
              >
                <option value="">All Control</option>
                <option :value="true">Enabled</option>
                <option :value="false">Disabled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

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
              <div class="mt-2 flex items-center justify-between">
                <div class="flex items-center">
                  <Icon
                    name="lucide:users"
                    class="mr-1 h-4 w-4 text-high-contrast"
                  />
                  <span class="text-sm text-default"
                    >{{ device.viewerCount }} connected</span
                  >
                </div>
                <div class="flex items-center space-x-2">
                  <Icon
                    :name="
                      device.control
                        ? 'heroicons:check-circle'
                        : 'heroicons:x-circle'
                    "
                    class="w-5 h-5"
                    :class="device.control ? 'text-green-500' : 'text-red-500'"
                  />
                  <span
                    class="text-sm"
                    :class="
                      device.control
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    "
                  >
                    Control
                  </span>
                </div>
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

      <!-- Pagination -->
      <div class="mt-6 flex justify-center">
        <button
          @click="changePage(-1)"
          :disabled="currentPage === 1"
          class="mr-2 rounded-md bg-accent-emphasis px-4 py-2 disabled:opacity-50"
        >
          Previous
        </button>
        <span class="mx-4 flex items-center">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button
          @click="changePage(1)"
          :disabled="currentPage === totalPages"
          class="ml-2 rounded-md bg-accent-emphasis px-4 py-2 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { initializeUserData } from '../composables/networks/webSocket';

/*global defineOgImageComponent*/
defineOgImageComponent('Remo', {
  headline: 'Devices',
  title: 'Choose a Device',
  description: 'Choose a device to connect to 💻',
  colorMode: 'light'
});

const router = useRouter();

/*global webSocket*/
const { websocket, sendMessageOnConnection } = webSocket(false);

// Reactive list of devices
const devices = ref([]);
const isLoading = ref(true);
const perPage = ref(6);
const currentPage = ref(1);
const totalDevices = ref(0);
const loadingCardCount = 3;

// Filters
const filters = ref({
  name: '',
  os: '',
  version: '',
  control: ''
});

// Computed property for total pages
const totalPages = computed(() =>
  Math.ceil(totalDevices.value / perPage.value)
);

// Mock devices data
const mockDevices = [
  {
    id: 'TEST2',
    name: 'Laptop',
    os: 'macOS',
    version: '0.0.1',
    online: false,
    viewerCount: 0,
    control: false
  },
  {
    id: 'TEST3',
    name: 'Server',
    os: 'Linux',
    version: '0.0.1b',
    online: false,
    viewerCount: 0,
    control: true
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
      path: `/stream/${device.id}`
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
    control: data[room].control,
    online: true
  }));

  // Combine updated devices with mock devices
  devices.value = [...updatedDevices, ...mockDevices];
  isLoading.value = false;
};

const applyFilters = () => {
  currentPage.value = 1;
  fetchDevices();
};

const changePage = (direction) => {
  currentPage.value += direction;
  fetchDevices();
};

const fetchDevices = () => {
  isLoading.value = true;
  sendMessageOnConnection({
    type: 'get_room_list',
    page: currentPage.value,
    per_page: perPage.value,
    name: filters.value.name || undefined,
    os: filters.value.os || undefined,
    version: filters.value.version || undefined,
    control: filters.value.control === '' ? undefined : filters.value.control
  });
};

const setupWebSocketHandlers = () => {
  if (!websocket.value) return;

  websocket.value.onmessage = (event) => {
    const signal = JSON.parse(event.data);
    if (signal.type === 'room_list_response') {
      populateDevices(signal.rooms);
      totalDevices.value = signal.total_count || 0;
    } else if (signal.type === 'new_room_notification') {
      fetchDevices();
    }
  };
};

onMounted(async () => {
  const userData = initializeUserData();
  if (Object.keys(userData).length === 0) {
    // Only redirect if we're not already on the index page
    if (router.currentRoute.value.path !== '/') {
      router.push('/');
    }
    return;
  }

  // Setup initial WebSocket handlers
  setupWebSocketHandlers();

  fetchDevices();

  // Subscribe to room updates
  await sendMessageOnConnection({ type: 'subscribe_room_updates' });

  // Watch for WebSocket changes and reset handlers
  watch(
    () => websocket.value,
    (newSocket) => {
      if (newSocket) {
        setupWebSocketHandlers();
        // Resubscribe to room updates when connection is restored
        sendMessageOnConnection({ type: 'subscribe_room_updates' });
        // Refresh the device list
        fetchDevices();
      }
    }
  );
});

onUnmounted(() => {
  // Unsubscribe from room updates
  sendMessageOnConnection({ type: 'unsubscribe_room_updates' });
});
</script>
