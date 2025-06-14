<template>
  <div
    v-if="enabled && !hasPhysicalGamepad"
    class="virtual-joystick-container no-select"
    @touchstart.prevent
    @touchmove.prevent
    @touchend.prevent
  >
    <!-- Left Side Controls -->
    <div class="controls-section left-controls">
      <!-- Left Trigger -->
      <div class="trigger-container">
        <button
          class="trigger-button"
          :class="{
            'trigger-pressed': triggerValues.lt > 0,
            'trigger-locked': triggerLocked.lt,
            'button-pressed': buttonStyles.trigger.lt.active
          }"
          @mousedown="startTriggerDrag('lt', $event)"
          @touchstart="startTriggerDrag('lt', $event)"
        >
          <span class="trigger-label">LT</span>
          <span v-if="triggerLocked.lt" class="lock-indicator">🔒</span>
        </button>
      </div>

      <!-- Left Bumper -->
      <button
        class="bumper-button"
        :class="{ 'button-pressed': buttonStyles.bumper.lb.active }"
        @mousedown="updateButton('lb', true)"
        @mouseup="updateButton('lb', false)"
        @touchstart="updateButton('lb', true)"
        @touchend="updateButton('lb', false)"
      >
        LB
      </button>

      <!-- Left Joystick -->
      <div
        class="joystick left-joystick"
        ref="leftJoystickRef"
        @mousedown="startDrag('left', $event)"
        @touchstart="startDrag('left', $event)"
      >
        <div
          class="joystick-button"
          :style="[
            leftJoystickStyle,
            { transition: 'background 0.1s, box-shadow 0.1s, scale 0.1s' }
          ]"
        ></div>
      </div>

      <!-- D-Pad -->
      <div class="dpad">
        <button
          class="dpad-button up"
          :class="{ 'button-pressed': buttonStyles.dpad.up.active }"
          @mousedown="updateButton('dpad_up', true)"
          @mouseup="updateButton('dpad_up', false)"
          @touchstart="updateButton('dpad_up', true)"
          @touchend="updateButton('dpad_up', false)"
        >
          ▲
        </button>
        <button
          class="dpad-button left"
          :class="{ 'button-pressed': buttonStyles.dpad.left.active }"
          @mousedown="updateButton('dpad_left', true)"
          @mouseup="updateButton('dpad_left', false)"
          @touchstart="updateButton('dpad_left', true)"
          @touchend="updateButton('dpad_left', false)"
        >
          ◄
        </button>
        <button
          class="dpad-button right"
          :class="{ 'button-pressed': buttonStyles.dpad.right.active }"
          @mousedown="updateButton('dpad_right', true)"
          @mouseup="updateButton('dpad_right', false)"
          @touchstart="updateButton('dpad_right', true)"
          @touchend="updateButton('dpad_right', false)"
        >
          ►
        </button>
        <button
          class="dpad-button down"
          :class="{ 'button-pressed': buttonStyles.dpad.down.active }"
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
        <button
          class="trigger-button"
          :class="{
            'trigger-pressed': triggerValues.rt > 0,
            'trigger-locked': triggerLocked.rt,
            'button-pressed': buttonStyles.trigger.rt.active
          }"
          @mousedown="startTriggerDrag('rt', $event)"
          @touchstart="startTriggerDrag('rt', $event)"
        >
          <span class="trigger-label">RT</span>
          <span v-if="triggerLocked.rt" class="lock-indicator">🔒</span>
        </button>
      </div>

      <!-- Right Bumper -->
      <button
        class="bumper-button"
        :class="{ 'button-pressed': buttonStyles.bumper.rb.active }"
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
          :class="{ 'button-pressed': buttonStyles.face.y.active }"
          @mousedown="updateButton('y', true)"
          @mouseup="updateButton('y', false)"
          @touchstart="updateButton('y', true)"
          @touchend="updateButton('y', false)"
        >
          Y
        </button>
        <button
          class="face-button x"
          :class="{ 'button-pressed': buttonStyles.face.x.active }"
          @mousedown="updateButton('x', true)"
          @mouseup="updateButton('x', false)"
          @touchstart="updateButton('x', true)"
          @touchend="updateButton('x', false)"
        >
          X
        </button>
        <button
          class="face-button b"
          :class="{ 'button-pressed': buttonStyles.face.b.active }"
          @mousedown="updateButton('b', true)"
          @mouseup="updateButton('b', false)"
          @touchstart="updateButton('b', true)"
          @touchend="updateButton('b', false)"
        >
          B
        </button>
        <button
          class="face-button a"
          :class="{ 'button-pressed': buttonStyles.face.a.active }"
          @mousedown="updateButton('a', true)"
          @mouseup="updateButton('a', false)"
          @touchstart="updateButton('a', true)"
          @touchend="updateButton('a', false)"
        >
          A
        </button>
      </div>

      <!-- Right Joystick -->
      <div
        class="joystick right-joystick"
        ref="rightJoystickRef"
        @mousedown="startDrag('right', $event)"
        @touchstart="startDrag('right', $event)"
      >
        <div
          class="joystick-button"
          :style="[
            rightJoystickStyle,
            { transition: 'background 0.1s, box-shadow 0.1s, scale 0.1s' }
          ]"
        ></div>
      </div>
    </div>

    <!-- Center Controls -->
    <div class="center-controls">
      <button
        class="system-button back"
        :class="{ 'button-pressed': buttonStyles.system.back.active }"
        @mousedown="updateButton('back', true)"
        @mouseup="updateButton('back', false)"
        @touchstart="updateButton('back', true)"
        @touchend="updateButton('back', false)"
      >
        Back
      </button>
      <button
        class="system-button guide"
        :class="{ 'button-pressed': buttonStyles.system.guide.active }"
        @mousedown="updateButton('guide', true)"
        @mouseup="updateButton('guide', false)"
        @touchstart="updateButton('guide', true)"
        @touchend="updateButton('guide', false)"
      >
        Guide
      </button>
      <button
        class="system-button start"
        :class="{ 'button-pressed': buttonStyles.system.start.active }"
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
import { useJoystickLayout } from '../composables/controls/joystickLayout';

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
  transform: `translate(calc(-50% + ${leftPosition.value.x}px), calc(-50% + ${leftPosition.value.y}px))`,
  background: buttonStyles.value.stick.left.active
    ? 'rgba(255, 255, 255, 1)'
    : 'rgba(255, 255, 255, 0.8)',
  boxShadow: buttonStyles.value.stick.left.active
    ? '0 0 10px rgba(255, 255, 255, 0.5)'
    : 'none',
  scale: buttonStyles.value.stick.left.active ? '0.85' : '1'
}));

const rightJoystickStyle = computed(() => ({
  transform: `translate(calc(-50% + ${rightPosition.value.x}px), calc(-50% + ${rightPosition.value.y}px))`,
  background: buttonStyles.value.stick.right.active
    ? 'rgba(255, 255, 255, 1)'
    : 'rgba(255, 255, 255, 0.8)',
  boxShadow: buttonStyles.value.stick.right.active
    ? '0 0 10px rgba(255, 255, 255, 0.5)'
    : 'none',
  scale: buttonStyles.value.stick.right.active ? '0.85' : '1'
}));

// Track all currently pressed buttons
const pressedButtons = ref(new Set());

const triggerValues = ref({
  lt: 0,
  rt: 0
});

const triggerLocked = ref({ lt: false, rt: false });
const triggerPressed = ref({ lt: false, rt: false });

const controlSize = ref(100); // Default value
const buttonSize = computed(() => controlSize.value / 2);
const smallButtonSize = computed(() => controlSize.value / 3);

const {
  leftStickPosition,
  rightStickPosition,
  buttonsPosition,
  triggersPosition,
  loadLayout
} = useJoystickLayout();

const dragging = ref(null);
const resizing = ref(null);
const startPos = ref({ x: 0, y: 0 });
const startSize = ref(0);

const triggerDragStart = ref({ lt: null, rt: null });
const triggerDragThreshold = 20; // pixels to drag up for locking

// Add double tap detection
const lastTapTime = ref({ left: 0, right: 0 });
const doubleTapThreshold = 300; // milliseconds

// Add double tap and stick press tracking
const stickPressed = ref({ left: false, right: false });

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

function startTriggerDrag(trigger, event) {
  event.stopPropagation(); // Prevent event from bubbling up

  // If already locked, unlock it
  if (triggerLocked.value[trigger]) {
    triggerLocked.value[trigger] = false;
    triggerValues.value[trigger] = 0;
    emitState();
    return;
  }

  triggerPressed.value[trigger] = true;
  const y = event.type.includes('touch')
    ? event.touches[0].clientY
    : event.clientY;

  triggerDragStart.value[trigger] = y;
  triggerValues.value[trigger] = 255;
  emitState();

  // Add global event listeners for drag and release
  if (event.type.includes('touch')) {
    window.addEventListener('touchmove', (e) => handleTriggerDrag(trigger, e), {
      passive: false
    });
    window.addEventListener('touchend', () => endTriggerDrag(trigger), {
      once: true
    });
  } else {
    window.addEventListener('mousemove', (e) => handleTriggerDrag(trigger, e));
    window.addEventListener('mouseup', () => endTriggerDrag(trigger), {
      once: true
    });
  }
}

function handleTriggerDrag(trigger, event) {
  if (triggerDragStart.value[trigger] === null || triggerLocked.value[trigger])
    return;

  event.preventDefault(); // Prevent scrolling

  const y = event.type.includes('touch')
    ? event.touches[0].clientY
    : event.clientY;

  const dragDistance = triggerDragStart.value[trigger] - y;

  if (dragDistance > triggerDragThreshold && !triggerLocked.value[trigger]) {
    triggerLocked.value[trigger] = true;
    triggerValues.value[trigger] = 255;
    triggerDragStart.value[trigger] = null;

    // Remove global event listeners when locked
    if (event.type.includes('touch')) {
      window.removeEventListener('touchmove', handleTriggerDrag);
      window.removeEventListener('touchend', endTriggerDrag);
    } else {
      window.removeEventListener('mousemove', handleTriggerDrag);
      window.removeEventListener('mouseup', endTriggerDrag);
    }

    emitState();
  }
}

function endTriggerDrag(trigger) {
  if (triggerDragStart.value[trigger] === null) return;

  triggerPressed.value[trigger] = false;

  if (!triggerLocked.value[trigger]) {
    triggerValues.value[trigger] = 0;
    emitState();
  }

  triggerDragStart.value[trigger] = null;

  // Remove global event listeners
  window.removeEventListener('mousemove', handleTriggerDrag);
  window.removeEventListener('mouseup', endTriggerDrag);
  window.removeEventListener('touchmove', handleTriggerDrag);
  window.removeEventListener('touchend', endTriggerDrag);
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

  const rect =
    side === 'left'
      ? leftJoystickRef.value.getBoundingClientRect()
      : rightJoystickRef.value.getBoundingClientRect();

  // Handle double tap detection first
  const now = Date.now();
  const lastTap = lastTapTime.value[side];
  lastTapTime.value[side] = now;

  if (now - lastTap < doubleTapThreshold) {
    stickPressed.value[side] = true;
    updateButton(side === 'left' ? 'left_stick' : 'right_stick', true);
    // Don't return here - continue with drag setup
  }

  // Handle mouse events
  if (event.type === 'mousedown') {
    const identifier = 'mouse-' + side;

    if (side === 'left') {
      leftDragIdentifier.value = identifier;
      updateJoystickPosition('left', event, rect);
    } else {
      rightDragIdentifier.value = identifier;
      updateJoystickPosition('right', event, rect);
    }

    const handleMouseMove = (e) => handleDrag(e, identifier);
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      stopDrag(side);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  // Handle touch events
  else if (event.type === 'touchstart') {
    const touch = Array.from(event.touches).find((t) =>
      isPointInRect(t.clientX, t.clientY, rect)
    );

    if (touch) {
      if (side === 'left') {
        leftDragIdentifier.value = touch.identifier;
        updateJoystickPosition('left', touch, rect);
      } else {
        rightDragIdentifier.value = touch.identifier;
        updateJoystickPosition('right', touch, rect);
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
  const margin = rect.width * 1; // Increased from 0.3 to 1 (100% margin around the joystick)
  return (
    x >= rect.left - margin &&
    x <= rect.right + margin &&
    y >= rect.top - margin &&
    y <= rect.bottom + margin
  );
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

  // Handle right joystick
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

  // Calculate the delta from the center
  let deltaX = touch.clientX - centerX;
  let deltaY = touch.clientY - centerY;

  // Calculate the distance from center
  const radius = rect.width / 2;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // If clicked/touched outside the radius, normalize to max radius
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

// Update stopDrag to handle stick press state
function stopDrag(side) {
  if (side === 'left') {
    leftPosition.value = { x: 0, y: 0 };
    leftDragIdentifier.value = null;
    if (stickPressed.value.left) {
      stickPressed.value.left = false;
      updateButton('left_stick', false);
    }
  } else if (side === 'right') {
    rightPosition.value = { x: 0, y: 0 };
    rightDragIdentifier.value = null;
    if (stickPressed.value.right) {
      stickPressed.value.right = false;
      updateButton('right_stick', false);
    }
  }
  emitState();
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize(); // Initial size calculation
  loadLayout();
  document.addEventListener('pointermove', handleDragMove);
  document.addEventListener('pointerup', handleDragEnd);
});

onUnmounted(() => {
  stopDrag();
  pressedButtons.value.clear();
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('pointermove', handleDragMove);
  document.removeEventListener('pointerup', handleDragEnd);
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

const handleDragMove = (event) => {
  if (dragging.value) {
    const dx = event.clientX - startPos.value.x;
    const dy = event.clientY - startPos.value.y;
    const position = getElementPosition(dragging.value);

    // Convert pixel movement to percentage of viewport
    const percentX = (dx / window.innerWidth) * 100;
    const percentY = (dy / window.innerHeight) * 100;

    position.x = Math.max(0, Math.min(100, position.x + percentX));
    position.y = Math.max(0, Math.min(100, position.y + percentY));

    startPos.value = {
      x: event.clientX,
      y: event.clientY
    };
  } else if (resizing.value) {
    const dx = event.clientX - startPos.value.x;
    const dy = event.clientY - startPos.value.y;
    const position = getElementPosition(resizing.value);

    // Use the larger of dx or dy for proportional scaling
    const delta = Math.max(dx, dy);
    position.size = Math.max(60, Math.min(300, startSize.value + delta));
  }
};

const handleDragEnd = () => {
  dragging.value = null;
  resizing.value = null;
};

const getElementPosition = (element) => {
  switch (element) {
    case 'leftStick':
      return leftStickPosition.value;
    case 'rightStick':
      return rightStickPosition.value;
    case 'buttons':
      return buttonsPosition.value;
    case 'triggers':
      return triggersPosition.value;
  }
};

// Add these computed properties
const buttonStyles = computed(() => ({
  face: {
    a: { active: pressedButtons.value.has('a') },
    b: { active: pressedButtons.value.has('b') },
    x: { active: pressedButtons.value.has('x') },
    y: { active: pressedButtons.value.has('y') }
  },
  dpad: {
    up: { active: pressedButtons.value.has('dpad_up') },
    down: { active: pressedButtons.value.has('dpad_down') },
    left: { active: pressedButtons.value.has('dpad_left') },
    right: { active: pressedButtons.value.has('dpad_right') }
  },
  bumper: {
    lb: { active: pressedButtons.value.has('lb') },
    rb: { active: pressedButtons.value.has('rb') }
  },
  trigger: {
    lt: { active: triggerPressed.value.lt || triggerLocked.value.lt },
    rt: { active: triggerPressed.value.rt || triggerLocked.value.rt }
  },
  system: {
    back: { active: pressedButtons.value.has('back') },
    guide: { active: pressedButtons.value.has('guide') },
    start: { active: pressedButtons.value.has('start') }
  },
  stick: {
    left: { active: pressedButtons.value.has('left_stick') },
    right: { active: pressedButtons.value.has('right_stick') }
  }
}));
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
  z-index: 1001;
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
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  margin: 5px 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.joystick-button {
  width: v-bind('buttonSize + "px"');
  height: v-bind('buttonSize + "px"');
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  cursor: pointer;
  user-select: none;
  will-change: transform;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
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
  background: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: v-bind('smallButtonSize / 2 + "px"');
  color: rgba(0, 0, 0, 0.75);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
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
  background: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.75);
  font-size: v-bind('smallButtonSize / 2 + "px"');
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
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
  background: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: v-bind('smallButtonSize / 3 + "px"');
  color: rgba(0, 0, 0, 0.75);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
}

.bumper-button {
  width: v-bind('controlSize / 2 + "px"');
  height: v-bind('smallButtonSize + "px"');
  background: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: v-bind('smallButtonSize / 2 + "px"');
  color: rgba(0, 0, 0, 0.75);
  margin: 5px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
}

.button-pressed {
  background: rgba(255, 255, 255, 1) !important;
  transform: scale(0.9) !important;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.4) !important;
}

.trigger-container {
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.trigger-button {
  width: v-bind('controlSize / 1.5 + "px"');
  height: v-bind('smallButtonSize + "px"');
  background: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: none;
  user-select: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.trigger-pressed:not(.trigger-locked) {
  background: rgba(255, 255, 255, 1);
  transform: scale(0.9);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
}

.trigger-locked {
  background: rgba(180, 180, 255, 1);
  border: 2px solid rgba(100, 100, 255, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(100, 100, 255, 0.3);
}

.lock-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  transition: opacity 0.2s ease;
}

.trigger-label {
  font-size: v-bind('smallButtonSize / 3 + "px"');
  color: rgba(0, 0, 0, 0.75);
  font-weight: bold;
}
</style>
