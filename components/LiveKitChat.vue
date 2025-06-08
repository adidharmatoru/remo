<template>
  <div
    v-if="visible"
    ref="overlayRef"
    class="fixed z-[10001] bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/10 shadow-lg no-select transition-opacity min-w-[300px] max-w-[400px]"
    :class="{
      'opacity-50 hover:opacity-100': !isDragging,
      'transform scale-102': isDragging
    }"
    :style="{
      top: position.y + 'px',
      left: position.x + 'px',
      transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      transition: isDragging ? 'none' : 'all 0.2s ease',
      width: '350px',
      height: '400px',
      display: 'flex',
      flexDirection: 'column'
    }"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between p-3 border-b border-white/10 cursor-move"
      @mousedown="startDragging"
      @mousemove="onDrag"
      @mouseup="stopDragging"
      @mouseleave="stopDragging"
      @touchstart="startDragging"
      @touchmove="onDrag"
      @touchend="stopDragging"
    >
      <div class="flex items-center space-x-2">
        <Icon name="lucide:message-circle" class="w-4 h-4 text-primary-500" />
        <span class="font-medium">Chat</span>
      </div>
      <div class="flex items-center space-x-2">
        <button
          class="p-1 hover:bg-white/10 rounded transition-colors flex items-center justify-center"
          @click="$emit('update:visible', false)"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Chat Messages -->
    <div class="flex-1 p-3 overflow-y-auto messages-container">
      <div v-if="messages.length === 0" class="text-center text-white/50 py-4">
        No messages yet. Start a conversation!
      </div>
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="mb-3 break-words"
      >
        <div
          class="flex items-start"
          :class="message.isLocal ? 'flex-row-reverse' : ''"
        >
          <div
            class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white/80"
            :class="message.isLocal ? 'bg-primary-500/50 text-white' : ''"
          >
            {{ getInitials(message.sender) }}
          </div>
          <div :class="message.isLocal ? 'mr-2' : 'ml-2'">
            <div
              class="flex items-baseline"
              :class="message.isLocal ? 'flex-row-reverse' : ''"
            >
              <span
                class="font-medium text-sm"
                :class="message.isLocal ? 'text-primary-400' : 'text-white'"
                >{{ message.sender }}</span
              >
              <span
                :class="message.isLocal ? 'mr-2' : 'ml-2'"
                class="text-xs text-white/50"
              >
                {{ formatTime(message.timestamp) }}
              </span>
            </div>
            <div
              class="mt-1 px-3 py-2 rounded-lg bg-white/10 text-white/90"
              :class="message.isLocal ? 'bg-primary-500/20 text-white' : ''"
            >
              {{ message.text }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-3 border-t border-white/10">
      <div class="flex items-center">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Type a message..."
          class="flex-1 bg-white/5 border border-white/10 rounded-l-md py-2 px-3 text-white placeholder-white/50 focus:outline-none focus:border-primary-500/50"
          @keyup.enter="sendMessage"
        />
        <button
          class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-r-md transition-colors flex items-center justify-center"
          @click="sendMessage"
        >
          <Icon name="lucide:send" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { RoomEvent } from 'livekit-client';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  room: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:visible', 'message-sent', 'unread-message']);

const overlayRef = ref(null);
const position = ref({ x: 16, y: 16 });
const dragOffset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const messages = ref([]);
const newMessage = ref('');
const username = ref('');

// Initialize username from localStorage
const initUsername = () => {
  let userData;
  try {
    userData = JSON.parse(localStorage.getItem('userData') || '{}');
  } catch {
    userData = {};
  }

  username.value = userData.name;
};

// Dragging functionality
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

// Get user initials for avatar
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

// Format timestamp
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Send chat message
const sendMessage = async () => {
  if (!newMessage.value.trim() || !props.room) return;

  // Create message object
  const messageObj = {
    text: newMessage.value.trim(),
    sender: username.value,
    timestamp: new Date().toISOString(),
    isLocal: true
  };

  // Add to local messages
  messages.value.push(messageObj);

  // Clear input
  newMessage.value = '';

  // Emit event
  emit('message-sent', messageObj);

  // Send to LiveKit room
  if (props.room && props.room.localParticipant) {
    const data = JSON.stringify(messageObj);
    await props.room.localParticipant.publishData(
      new TextEncoder().encode(data),
      {
        topic: 'chat',
        destination: 'all'
      }
    );
  }

  // Scroll to bottom
  await nextTick();
  scrollToBottom();
};

// Handle incoming messages
const handleRoomMessage = (data) => {
  try {
    const message = JSON.parse(new TextDecoder().decode(data));
    // Add isLocal flag
    message.isLocal = false;
    messages.value.push(message);

    // Emit unread message event if chat is not visible
    if (!props.visible) {
      emit('unread-message', message);
    }

    // Scroll to bottom when new message received
    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    console.error('Error parsing chat message:', error);
  }
};

// Scroll to bottom of messages
const scrollToBottom = () => {
  if (!overlayRef.value) return;
  const container = overlayRef.value.querySelector('.messages-container');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
};

// Save position to localStorage
const savePosition = () => {
  localStorage.setItem('livekit-chat-position', JSON.stringify(position.value));
};

// Load position from localStorage
const loadPosition = () => {
  const saved = localStorage.getItem('livekit-chat-position');
  if (saved) {
    position.value = JSON.parse(saved);
  }
};

// Watch for room changes
watch(
  () => props.room,
  (newRoom) => {
    if (newRoom) {
      // Use the correct event type from LiveKit
      newRoom.on(RoomEvent.DataReceived, handleRoomMessage);
    }
  }
);

// Watch for visibility changes
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  }
);

onMounted(() => {
  loadPosition();
  initUsername();

  // Add data listener if room already exists
  if (props.room) {
    props.room.on(RoomEvent.DataReceived, handleRoomMessage);
  }
});

onUnmounted(() => {
  savePosition();
  // Remove data listener
  if (props.room) {
    props.room.off(RoomEvent.DataReceived, handleRoomMessage);
  }
});
</script>

<style scoped>
.messages-container {
  max-height: calc(100% - 50px);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
</style>
