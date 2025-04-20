<template>
  <div class="loading-container">
    <div class="loading-content">
      <div class="loading-text">
        <span
          v-for="(letter, index) in 'REMO'"
          :key="index"
          :style="{ animationDelay: `${index * 0.2}s` }"
        >
          {{ letter }}
        </span>
      </div>
      <div class="loading-dots">
        <div
          class="dot"
          v-for="i in 3"
          :key="i"
          :style="{ animationDelay: `${(i - 1) * 0.2}s` }"
        />
      </div>
      <div class="reconnection-status">
        {{ reconnectionStatus }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  reconnectionStatus: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.loading-container {
  @apply fixed inset-0 flex items-center justify-center z-50;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  animation: fadeIn 0.5s ease-out;
}

.loading-content {
  @apply flex flex-col items-center;
  animation: slideUp 0.5s ease-out;
}

.loading-text {
  @apply flex items-center justify-center mb-8;
}

.loading-text span {
  @apply text-7xl font-bold text-white opacity-0;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  animation: fadeInOut 2s infinite;
  letter-spacing: 0.1em;
}

.loading-dots {
  @apply flex gap-4;
}

.dot {
  @apply w-3 h-3 rounded-full bg-white opacity-0;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
  animation: fadeInOut 2s infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.reconnection-status {
  @apply mt-8 text-white text-lg font-medium tracking-wider;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  animation: statusPulse 2s infinite;
}

@keyframes statusPulse {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
