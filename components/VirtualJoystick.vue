<template>
  <div
    v-if="enabled && (!hasPhysicalGamepad || isVirtualActive)"
    class="virtual-joystick-container"
    @touchstart.prevent
    @touchmove.prevent
    @touchend.prevent
  >
    <!-- Left Side Controls -->
    <div class="controls-section left-controls">
      <!-- Left Trigger -->
      <button
        class="trigger left-trigger"
        @mousedown="updateButton('lt', true)"
        @mouseup="updateButton('lt', false)"
        @touchstart="updateButton('lt', true)"
        @touchend="updateButton('lt', false)"
      >
        LT
      </button>

      <!-- Left Bumper -->
      <button
        class="bumper left-bumper"
        @mousedown="updateButton('lb', true)"
        @mouseup="updateButton('lb', false)"
        @touchstart="updateButton('lb', true)"
        @touchend="updateButton('lb', false)"
      >
        LB
      </button>

      <!-- Left Joystick -->
      <div class="joystick left-joystick" ref="leftJoystickRef">
        <div
          class="joystick-button"
          :style="leftJoystickStyle"
          @mousedown="startDrag('left')"
          @touchstart="startDrag('left')"
        ></div>
      </div>

      <!-- D-Pad -->
      <div class="dpad">
        <button
          class="dpad-button up"
          @mousedown="updateButton('dpad_up', true)"
          @mouseup="updateButton('dpad_up', false)"
          @touchstart="updateButton('dpad_up', true)"
          @touchend="updateButton('dpad_up', false)"
        >
          ▲
        </button>
        <button
          class="dpad-button left"
          @mousedown="updateButton('dpad_left', true)"
          @mouseup="updateButton('dpad_left', false)"
          @touchstart="updateButton('dpad_left', true)"
          @touchend="updateButton('dpad_left', false)"
        >
          ◄
        </button>
        <button
          class="dpad-button right"
          @mousedown="updateButton('dpad_right', true)"
          @mouseup="updateButton('dpad_right', false)"
          @touchstart="updateButton('dpad_right', true)"
          @touchend="updateButton('dpad_right', false)"
        >
          ►
        </button>
        <button
          class="dpad-button down"
          @mousedown="updateButton('dpad_down', true)"
          @mouseup="updateButton('dpad_down', false)"
          @touchstart="updateButton('dpad_down', true)"
          @touchend="updateButton('dpad_down', false)"
        >
          ▼
        </button>
      </div>
    </div>

    <!-- Right Side Controls -->
    <div class="controls-section right-controls">
      <!-- Right Trigger -->
      <button
        class="trigger right-trigger"
        @mousedown="updateButton('rt', true)"
        @mouseup="updateButton('rt', false)"
        @touchstart="updateButton('rt', true)"
        @touchend="updateButton('rt', false)"
      >
        RT
      </button>

      <!-- Right Bumper -->
      <button
        class="bumper right-bumper"
        @mousedown="updateButton('rb', true)"
        @mouseup="updateButton('rb', false)"
        @touchstart="updateButton('rb', true)"
        @touchend="updateButton('rb', false)"
      >
        RB
      </button>

      <!-- Face Buttons -->
      <div class="face-buttons">
        <button
          class="face-button y"
          @mousedown="updateButton('y', true)"
          @mouseup="updateButton('y', false)"
          @touchstart="updateButton('y', true)"
          @touchend="updateButton('y', false)"
        >
          Y
        </button>
        <button
          class="face-button x"
          @mousedown="updateButton('x', true)"
          @mouseup="updateButton('x', false)"
          @touchstart="updateButton('x', true)"
          @touchend="updateButton('x', false)"
        >
          X
        </button>
        <button
          class="face-button b"
          @mousedown="updateButton('b', true)"
          @mouseup="updateButton('b', false)"
          @touchstart="updateButton('b', true)"
          @touchend="updateButton('b', false)"
        >
          B
        </button>
        <button
          class="face-button a"
          @mousedown="updateButton('a', true)"
          @mouseup="updateButton('a', false)"
          @touchstart="updateButton('a', true)"
          @touchend="updateButton('a', false)"
        >
          A
        </button>
      </div>

      <!-- Right Joystick -->
      <div class="joystick right-joystick" ref="rightJoystickRef">
        <div
          class="joystick-button"
          :style="rightJoystickStyle"
          @mousedown="startDrag('right')"
          @touchstart="startDrag('right')"
        ></div>
      </div>
    </div>

    <!-- Center Controls -->
    <div class="center-controls">
      <button
        class="system-button back"
        @mousedown="updateButton('back', true)"
        @mouseup="updateButton('back', false)"
        @touchstart="updateButton('back', true)"
        @touchend="updateButton('back', false)"
      >
        Back
      </button>
      <button
        class="system-button guide"
        @mousedown="updateButton('guide', true)"
        @mouseup="updateButton('guide', false)"
        @touchstart="updateButton('guide', true)"
        @touchend="updateButton('guide', false)"
      >
        Guide
      </button>
      <button
        class="system-button start"
        @mousedown="updateButton('start', true)"
        @mouseup="updateButton('start', false)"
        @touchstart="updateButton('start', true)"
        @touchend="updateButton('start', false)"
      >
        Start
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed, watch } from 'vue';

const props = defineProps({
  enabled: {
    type: Boolean,
    default: false
  },
  hasPhysicalGamepad: {
    type: Boolean,
    default: false
  },
  isVirtualActive: {
    type: Boolean,
    default: true
  },
  onStateChange: {
    type: Function,
    required: true
  }
});

const leftJoystickRef = ref(null);
const rightJoystickRef = ref(null);
const activeDrag = ref(null);
const leftPosition = ref({ x: 0, y: 0 });
const rightPosition = ref({ x: 0, y: 0 });
const buttons = ref({
  a: false,
  b: false,
  x: false,
  y: false,
  lb: false,
  rb: false,
  start: false,
  back: false,
  guide: false,
  left_stick: false,
  right_stick: false,
  dpad_up: false,
  dpad_down: false,
  dpad_left: false,
  dpad_right: false,
  lt: false,
  rt: false
});

const leftJoystickStyle = computed(() => ({
  transform: `translate(calc(-50% + ${leftPosition.value.x}px), calc(-50% + ${leftPosition.value.y}px))`
}));

const rightJoystickStyle = computed(() => ({
  transform: `translate(calc(-50% + ${rightPosition.value.x}px), calc(-50% + ${rightPosition.value.y}px))`
}));

// Track all currently pressed buttons
const pressedButtons = ref(new Set());

function updateButton(button, pressed) {
  if (pressed) {
    pressedButtons.value.add(button);
  } else {
    pressedButtons.value.delete(button);
  }

  // Update buttons state with all currently pressed buttons
  const buttonState = {};
  for (const btn of Object.keys(buttons.value)) {
    buttonState[btn] = pressedButtons.value.has(btn);
  }

  emitState(buttonState);
}

function emitState(buttonState = null) {
  const state = {
    axes: {
      left_stick_x: Math.round((leftPosition.value.x / (120 / 2)) * 32767),
      left_stick_y: Math.round((-leftPosition.value.y / (120 / 2)) * 32767),
      right_stick_x: Math.round((rightPosition.value.x / (120 / 2)) * 32767),
      right_stick_y: Math.round((-rightPosition.value.y / (120 / 2)) * 32767),
      left_trigger: pressedButtons.value.has('lt') ? 32767 : 0,
      right_trigger: pressedButtons.value.has('rt') ? 32767 : 0
    },
    buttons:
      buttonState ||
      Object.fromEntries(
        Object.keys(buttons.value).map((btn) => [
          btn,
          pressedButtons.value.has(btn)
        ])
      )
  };
  props.onStateChange(state);
}

function startDrag(side) {
  activeDrag.value = side;
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchmove', handleDrag);
  document.addEventListener('touchend', stopDrag);
}

function handleDrag(event) {
  if (!activeDrag.value) return;

  const joystickRef =
    activeDrag.value === 'left'
      ? leftJoystickRef.value
      : rightJoystickRef.value;
  const rect = joystickRef.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  let deltaX = clientX - centerX;
  let deltaY = clientY - centerY;

  // Limit the joystick movement to a circle
  const radius = rect.width / 2;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  if (distance > radius) {
    const angle = Math.atan2(deltaY, deltaX);
    deltaX = Math.cos(angle) * radius;
    deltaY = Math.sin(angle) * radius;
  }

  if (activeDrag.value === 'left') {
    leftPosition.value = { x: deltaX, y: deltaY };
  } else {
    rightPosition.value = { x: deltaX, y: deltaY };
  }

  emitState();
}

function stopDrag() {
  if (!activeDrag.value) return;

  if (activeDrag.value === 'left') {
    leftPosition.value = { x: 0, y: 0 };
  } else {
    rightPosition.value = { x: 0, y: 0 };
  }

  activeDrag.value = null;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('touchend', stopDrag);

  emitState();
}

onUnmounted(() => {
  stopDrag();
  pressedButtons.value.clear();
});

// Optional: Watch for hasPhysicalGamepad changes to debug
watch(
  () => props.hasPhysicalGamepad,
  (newValue) => {
    console.log('Physical Gamepad Status:', newValue);
  }
);
</script>

<style scoped>
.virtual-joystick-container {
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 20px;
  pointer-events: none;
  z-index: 1000;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  pointer-events: auto;
}

.left-controls {
  order: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.right-controls {
  order: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.center-controls {
  order: 2;
  display: flex;
  gap: 10px;
  pointer-events: auto;
  margin-bottom: 20px;
}

.joystick {
  position: relative;
  width: 120px;
  height: 120px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin: 10px 0;
}

.joystick-button {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.dpad {
  position: relative;
  width: 120px;
  height: 120px;
}

.dpad-button {
  position: absolute;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: rgba(0, 0, 0, 0.8);
}

.dpad-button.up {
  top: 0;
  left: 40px;
}
.dpad-button.right {
  top: 40px;
  right: 0;
}
.dpad-button.down {
  bottom: 0;
  left: 40px;
}
.dpad-button.left {
  top: 40px;
  left: 0;
}

.face-buttons {
  position: relative;
  width: 120px;
  height: 120px;
}

.face-button {
  position: absolute;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.8);
}

.face-button.y {
  top: 0;
  left: 40px;
}
.face-button.x {
  top: 40px;
  left: 0;
}
.face-button.b {
  top: 40px;
  right: 0;
}
.face-button.a {
  bottom: 0;
  left: 40px;
}

.system-button {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.8);
}

button:active {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(0.95);
}

.trigger {
  width: 60px;
  height: 30px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.8);
  margin-bottom: 10px;
}

.bumper {
  width: 80px;
  height: 25px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.8);
  margin-bottom: 15px;
}
</style>
