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
      <div class="trigger-container">
        <input
          type="range"
          class="trigger left-trigger"
          min="0"
          max="255"
          :value="triggerValues.lt"
          @input="updateTrigger('lt', $event)"
          @touchstart.stop
          @touchmove.stop
          @touchend.stop
        />
        <span class="trigger-label">LT</span>
      </div>

      <!-- Left Bumper -->
      <button
        class="bumper-button"
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
          @mousedown="startDrag('left', $event)"
          @touchstart="startDrag('left', $event)"
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
      <div class="trigger-container">
        <input
          type="range"
          class="trigger right-trigger"
          min="0"
          max="255"
          :value="triggerValues.rt"
          @input="updateTrigger('rt', $event)"
          @touchstart.stop
          @touchmove.stop
          @touchend.stop
        />
        <span class="trigger-label">RT</span>
      </div>

      <!-- Right Bumper -->
      <button
        class="bumper-button"
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
          @mousedown="startDrag('right', $event)"
          @touchstart="startDrag('right', $event)"
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
import { ref, onUnmounted, computed, watch, onMounted } from 'vue';

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
const leftDragIdentifier = ref(null);
const rightDragIdentifier = ref(null);
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

const triggerValues = ref({
  lt: 0,
  rt: 0
});

const controlSize = ref(100); // Default value
const buttonSize = computed(() => controlSize.value / 2);
const smallButtonSize = computed(() => controlSize.value / 3);

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

function updateTrigger(trigger, event) {
  triggerValues.value[trigger] = parseInt(event.target.value);
  emitState();
}

function emitState(buttonState = null) {
  const state = {
    axes: {
      left_stick_x: Math.round(
        (leftPosition.value.x / (controlSize.value / 2)) * 32767
      ),
      left_stick_y: Math.round(
        (-leftPosition.value.y / (controlSize.value / 2)) * 32767
      ),
      right_stick_x: Math.round(
        (rightPosition.value.x / (controlSize.value / 2)) * 32767
      ),
      right_stick_y: Math.round(
        (-rightPosition.value.y / (controlSize.value / 2)) * 32767
      ),
      left_trigger: triggerValues.value.lt,
      right_trigger: triggerValues.value.rt
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

function startDrag(side, event) {
  event.preventDefault();
  event.stopPropagation();

  if (event.type === 'mousedown') {
    const identifier = 'mouse-' + side;
    if (side === 'left') {
      leftDragIdentifier.value = identifier;
    } else {
      rightDragIdentifier.value = identifier;
    }

    const handleMouseMove = (e) => handleDrag(e, identifier);
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      stopDrag(side);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  } else if (event.type === 'touchstart') {
    // Find the specific touch that started this drag
    const touch = Array.from(event.touches).find((t) => {
      const rect =
        side === 'left'
          ? leftJoystickRef.value.getBoundingClientRect()
          : rightJoystickRef.value.getBoundingClientRect();

      return isPointInRect(t.clientX, t.clientY, rect);
    });

    if (touch) {
      if (side === 'left') {
        leftDragIdentifier.value = touch.identifier;
      } else {
        rightDragIdentifier.value = touch.identifier;
      }
    }

    if (!document.touchListenersAdded) {
      document.addEventListener('touchmove', handleTouchDrag, {
        passive: false
      });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchEnd);
      document.touchListenersAdded = true;
    }
  }
}

// Add helper function to check if a point is within a rectangle
function isPointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// Update handleTouchDrag to handle touches independently
function handleTouchDrag(event) {
  event.preventDefault();

  const touches = Array.from(event.touches);

  // Handle left joystick
  const leftTouch = touches.find(
    (t) => t.identifier === leftDragIdentifier.value
  );
  if (leftTouch && leftJoystickRef.value) {
    const rect = leftJoystickRef.value.getBoundingClientRect();
    updateJoystickPosition('left', leftTouch, rect);
  }

  // Handle right joystick independently
  const rightTouch = touches.find(
    (t) => t.identifier === rightDragIdentifier.value
  );
  if (rightTouch && rightJoystickRef.value) {
    const rect = rightJoystickRef.value.getBoundingClientRect();
    updateJoystickPosition('right', rightTouch, rect);
  }
}

function updateJoystickPosition(side, touch, rect) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let deltaX = touch.clientX - centerX;
  let deltaY = touch.clientY - centerY;

  // Limit the joystick movement to a circle
  const radius = rect.width / 2;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  if (distance > radius) {
    const angle = Math.atan2(deltaY, deltaX);
    deltaX = Math.cos(angle) * radius;
    deltaY = Math.sin(angle) * radius;
  }

  if (side === 'left') {
    leftPosition.value = { x: deltaX, y: deltaY };
  } else {
    rightPosition.value = { x: deltaX, y: deltaY };
  }

  emitState();
}

function handleDrag(event, identifier) {
  const clientX = event.clientX || event.pageX;
  const clientY = event.clientY || event.pageY;
  const touch = { clientX, clientY };

  if (identifier === leftDragIdentifier.value) {
    const rect = leftJoystickRef.value.getBoundingClientRect();
    updateJoystickPosition('left', touch, rect);
  }

  if (identifier === rightDragIdentifier.value) {
    const rect = rightJoystickRef.value.getBoundingClientRect();
    updateJoystickPosition('right', touch, rect);
  }
}

// Update handleTouchEnd to handle each joystick independently
function handleTouchEnd(event) {
  const changedTouches = Array.from(event.changedTouches);

  // Check each ended touch
  changedTouches.forEach((touch) => {
    if (touch.identifier === leftDragIdentifier.value) {
      stopDrag('left');
    }
    if (touch.identifier === rightDragIdentifier.value) {
      stopDrag('right');
    }
  });

  // Only remove listeners if all touches are gone
  if (event.touches.length === 0) {
    document.removeEventListener('touchmove', handleTouchDrag);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
    document.touchListenersAdded = false;
  }
}

// Update stopDrag to be more specific about which joystick to reset
function stopDrag(side) {
  if (side === 'left') {
    leftPosition.value = { x: 0, y: 0 };
    leftDragIdentifier.value = null;
  } else if (side === 'right') {
    rightPosition.value = { x: 0, y: 0 };
    rightDragIdentifier.value = null;
  }
  emitState();
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize(); // Initial size calculation
});

onUnmounted(() => {
  stopDrag();
  pressedButtons.value.clear();
  window.removeEventListener('resize', handleResize);
});

function handleResize() {
  // Base size on viewport width and height for better landscape support
  const baseWidth = Math.min(window.innerWidth * 0.15, 120);
  const baseHeight = Math.min(window.innerHeight * 0.25, 120);
  controlSize.value = Math.max(60, Math.min(baseWidth, baseHeight));
}

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
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 10px;
  pointer-events: none;
  z-index: 1000;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  margin-bottom: 10px;
}

.joystick {
  position: relative;
  width: v-bind('controlSize + "px"');
  height: v-bind('controlSize + "px"');
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin: 5px 0;
}

.joystick-button {
  width: v-bind('buttonSize + "px"');
  height: v-bind('buttonSize + "px"');
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
  width: v-bind('controlSize + "px"');
  height: v-bind('controlSize + "px"');
}

.dpad-button {
  position: absolute;
  width: v-bind('smallButtonSize + "px"');
  height: v-bind('smallButtonSize + "px"');
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: v-bind('smallButtonSize / 2 + "px"');
  color: rgba(0, 0, 0, 0.8);
}

.dpad-button.up {
  top: 0;
  left: v-bind('smallButtonSize + "px"');
}
.dpad-button.right {
  top: v-bind('smallButtonSize + "px"');
  right: 0;
}
.dpad-button.down {
  bottom: 0;
  left: v-bind('smallButtonSize + "px"');
}
.dpad-button.left {
  top: v-bind('smallButtonSize + "px"');
  left: 0;
}

.face-buttons {
  position: relative;
  width: v-bind('controlSize + "px"');
  height: v-bind('controlSize + "px"');
}

.face-button {
  position: absolute;
  width: v-bind('smallButtonSize + "px"');
  height: v-bind('smallButtonSize + "px"');
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.8);
  font-size: v-bind('smallButtonSize / 2 + "px"');
}

.face-button.y {
  top: 0;
  left: v-bind('smallButtonSize + "px"');
}
.face-button.x {
  top: v-bind('smallButtonSize + "px"');
  left: 0;
}
.face-button.b {
  top: v-bind('smallButtonSize + "px"');
  right: 0;
}
.face-button.a {
  bottom: 0;
  left: v-bind('smallButtonSize + "px"');
}

.system-button {
  padding: v-bind('smallButtonSize / 4 + "px"')
    v-bind('smallButtonSize / 2 + "px"');
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: v-bind('smallButtonSize / 3 + "px"');
  color: rgba(0, 0, 0, 0.8);
}

.bumper-button {
  width: v-bind('controlSize / 2 + "px"');
  height: v-bind('smallButtonSize + "px"');
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: v-bind('smallButtonSize / 2 + "px"');
  color: rgba(0, 0, 0, 0.8);
  margin: 5px 0;
}

button:active {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(0.95);
}

.trigger-container {
  position: relative;
  width: v-bind('controlSize / 1.5 + "px"');
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.trigger {
  width: 100%;
  height: v-bind('smallButtonSize + "px"');
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  outline: none;
  cursor: pointer;
  touch-action: none;
}

.trigger::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: v-bind('smallButtonSize / 1.5 + "px"');
  height: v-bind('smallButtonSize + "px"');
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  cursor: pointer;
}

.trigger::-moz-range-thumb {
  width: v-bind('smallButtonSize / 1.5 + "px"');
  height: v-bind('smallButtonSize + "px"');
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  cursor: pointer;
  border: none;
}

.trigger-label {
  font-size: v-bind('smallButtonSize / 3 + "px"');
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}
</style>
