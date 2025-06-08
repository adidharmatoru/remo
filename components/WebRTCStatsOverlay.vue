<template>
  <div
    v-if="visible"
    ref="overlayRef"
    class="fixed z-[10001] bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/10 shadow-lg no-select transition-opacity"
    :class="{
      'opacity-50 hover:opacity-100':
        !isExpanded || (isExpanded && !isDragging),
      'transform scale-102': isDragging
    }"
    :style="{
      top: position.y + 'px',
      left: position.x + 'px',
      transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      transition: isDragging ? 'none' : 'all 0.2s ease'
    }"
  >
    <!-- Header -->
    <div
      class="flex items-center p-3 border-b border-white/10 cursor-move"
      @mousedown="startDragging"
      @mousemove="onDrag"
      @mouseup="stopDragging"
      @mouseleave="stopDragging"
      @touchstart="startDragging"
      @touchmove="onDrag"
      @touchend="stopDragging"
    >
      <div class="flex items-center space-x-2">
        <Icon name="lucide:activity" class="w-4 h-4 text-primary-500" />
        <span class="font-medium">RealTimeConnection Stats</span>
      </div>
      <div class="flex items-center space-x-2 ml-2">
        <button
          class="p-1 hover:bg-white/10 rounded transition-colors flex items-center justify-center"
          @click="isExpanded = !isExpanded"
        >
          <Icon
            :name="isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="w-4 h-4"
          />
        </button>
        <!-- <button
          class="p-1 hover:bg-white/10 rounded transition-colors flex items-center justify-center"
          @click="$emit('update:visible', false)"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </button> -->
      </div>
    </div>

    <!-- Content -->
    <div v-if="isExpanded" class="p-4 space-y-4">
      <!-- Connection Info -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-white/70">Connection</span>
          <span
            :class="
              connectionType === 'Direct' ? 'text-green-400' : 'text-yellow-400'
            "
          >
            {{ connectionType }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-white/70">Latency</span>
          <span :class="getLatencyClass(latency)">
            {{ Math.round(latency) }}ms
          </span>
        </div>
      </div>

      <!-- Video Stats -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-white/70">FPS</span>
          <span>{{ videoStats.fps }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-white/70">Resolution</span>
          <span
            >{{ videoStats.resolution.width }}x{{
              videoStats.resolution.height
            }}</span
          >
        </div>
        <div class="flex items-center justify-between">
          <span class="text-white/70">Packets Lost</span>
          <span :class="getPacketLossClass(videoStats.packetsLost)">
            {{ videoStats.packetsLost }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-white/70">Jitter</span>
          <span>{{ Math.round(videoStats.jitter * 1000) }}ms</span>
        </div>
      </div>

      <!-- Network Stats -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-white/70">Bandwidth</span>
          <span>{{ Math.round(connectionStats.bandwidth) }} kbps</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-white/70">Data Sent</span>
          <span>{{ formatBytes(connectionStats.bytesSent) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-white/70">Data Received</span>
          <span>{{ formatBytes(connectionStats.bytesReceived) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  latency: {
    type: Number,
    required: true
  },
  connectionType: {
    type: String,
    required: true
  },
  videoStats: {
    type: Object,
    required: true
  },
  connectionStats: {
    type: Object,
    required: true
  }
});

// eslint-disable-next-line no-unused-vars
const emit = defineEmits(['update:visible']);

const isExpanded = ref(true);
const isDragging = ref(false);
const overlayRef = ref(null);
const position = ref({ x: 16, y: 16 });
const dragOffset = ref({ x: 0, y: 0 });

const startDragging = (e) => {
  isDragging.value = true;
  let clientX, clientY;
  if (e.type.startsWith('touch')) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  const rect = overlayRef.value.getBoundingClientRect();
  dragOffset.value = {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  let clientX, clientY;
  if (e.type.startsWith('touch')) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  const newX = clientX - dragOffset.value.x;
  const newY = clientY - dragOffset.value.y;
  const rect = overlayRef.value.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width;
  const maxY = window.innerHeight - rect.height;
  position.value = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  };
};

const stopDragging = () => {
  isDragging.value = false;
};

const getLatencyClass = (latency) => {
  if (latency < 100) return 'text-green-400';
  if (latency < 180) return 'text-yellow-400';
  return 'text-red-400';
};

const getPacketLossClass = (packets) => {
  if (packets === 0) return 'text-green-400';
  if (packets < 10) return 'text-yellow-400';
  return 'text-red-400';
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Save position to localStorage
const savePosition = () => {
  localStorage.setItem('webrtc-stats-position', JSON.stringify(position.value));
};

// Load position from localStorage
const loadPosition = () => {
  const saved = localStorage.getItem('webrtc-stats-position');
  if (saved) {
    position.value = JSON.parse(saved);
  }
};

onMounted(() => {
  loadPosition();
});

onUnmounted(() => {
  savePosition();
});
</script>

<style scoped>
.floating-menu {
  z-index: 10000;
}

/* Add smooth transitions */
.transition-opacity {
  transition: opacity 0.2s ease;
}

/* Add a subtle shadow on hover */
.hover\:shadow-lg:hover {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>
