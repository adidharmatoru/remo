import { ref, onMounted, onUnmounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export const joystickControl = (eventChannel) => {
  const joystickEnabled = ref(false);
  const hasPhysicalGamepad = ref(false);
  const activeGamepad = ref(null);
  const isVirtualActive = ref(true);
  let userId = null;
  let animationFrameId = null;

  // Get user ID on initialization
  try {
    const userData = JSON.parse(localStorage.getItem('userData'));
    userId = userData?.id;
  } catch (error) {
    console.error(error);
    const uuid = uuidv4();
    const userData = {
      name: uuid,
      id: uuid
    };
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  function sendEventData(data) {
    if (!userId) {
      return;
    }

    if (eventChannel.value && eventChannel.value.readyState === 'open') {
      eventChannel.value.send(
        JSON.stringify({
          ...data,
          id: userId
        })
      );
    } else {
      console.warn('Event channel not ready');
    }
  }

  function handleGamepadConnected(event) {
    hasPhysicalGamepad.value = true;
    activeGamepad.value = event.gamepad;

    // Automatically switch to physical gamepad if joystick is enabled
    if (joystickEnabled.value) {
      isVirtualActive.value = false;
      updatePhysicalGamepadState();
    }
  }

  function handleGamepadDisconnected() {
    hasPhysicalGamepad.value = false;
    activeGamepad.value = null;

    // Automatically switch back to virtual if joystick is enabled
    if (joystickEnabled.value) {
      isVirtualActive.value = true;
    }
  }

  function updatePhysicalGamepadState() {
    if (!joystickEnabled.value || !hasPhysicalGamepad.value) return;

    // Get the latest gamepad state
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[activeGamepad.value?.index];

    if (!gamepad) {
      hasPhysicalGamepad.value = false;
      isVirtualActive.value = true;
      return;
    }

    // Add deadzone handling
    const applyDeadzone = (value, deadzone = 0.1) => {
      return Math.abs(value) < deadzone ? 0 : value;
    };

    // Process axes with deadzone
    const axes = {
      left_stick_x: Math.round(applyDeadzone(gamepad.axes[0]) * 32767),
      left_stick_y: Math.round(-applyDeadzone(gamepad.axes[1]) * 32767),
      right_stick_x: Math.round(applyDeadzone(gamepad.axes[2]) * 32767),
      right_stick_y: Math.round(-applyDeadzone(gamepad.axes[3]) * 32767),
      left_trigger: Math.round(gamepad.buttons[6]?.value * 32767),
      right_trigger: Math.round(gamepad.buttons[7]?.value * 32767)
    };

    // Process buttons with threshold
    const buttons = {
      a: gamepad.buttons[0]?.pressed || false,
      b: gamepad.buttons[1]?.pressed || false,
      x: gamepad.buttons[2]?.pressed || false,
      y: gamepad.buttons[3]?.pressed || false,
      lb: gamepad.buttons[4]?.pressed || false,
      rb: gamepad.buttons[5]?.pressed || false,
      back: gamepad.buttons[8]?.pressed || false,
      start: gamepad.buttons[9]?.pressed || false,
      guide: gamepad.buttons[16]?.pressed || false,
      left_stick: gamepad.buttons[10]?.pressed || false,
      right_stick: gamepad.buttons[11]?.pressed || false,
      dpad_up: gamepad.buttons[12]?.pressed || false,
      dpad_down: gamepad.buttons[13]?.pressed || false,
      dpad_left: gamepad.buttons[14]?.pressed || false,
      dpad_right: gamepad.buttons[15]?.pressed || false
    };

    handleJoystickState({ axes, buttons });

    animationFrameId = requestAnimationFrame(updatePhysicalGamepadState);
  }

  function handleJoystickConnect() {
    sendEventData({
      type: 'gamepad_connect'
    });
  }

  function handleJoystickDisconnect() {
    sendEventData({
      type: 'gamepad_disconnect'
    });
  }

  function handleJoystickState(state) {
    sendEventData({
      type: 'gamepad_state',
      state: {
        buttons: state.buttons,
        axes: {
          left_stick_x: Math.round(state.axes.left_stick_x),
          left_stick_y: Math.round(state.axes.left_stick_y),
          right_stick_x: Math.round(state.axes.right_stick_x),
          right_stick_y: Math.round(state.axes.right_stick_y),
          left_trigger: Math.round(state.axes.left_trigger),
          right_trigger: Math.round(state.axes.right_trigger)
        }
      }
    });
  }

  function toggleJoystick() {
    joystickEnabled.value = !joystickEnabled.value;

    if (joystickEnabled.value) {
      handleJoystickConnect();
      // If physical gamepad is connected, use it; otherwise, use virtual
      if (hasPhysicalGamepad.value) {
        isVirtualActive.value = false;
        updatePhysicalGamepadState();
      } else {
        isVirtualActive.value = true;
      }
    } else {
      handleJoystickDisconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      isVirtualActive.value = false;
    }
  }

  function cleanup() {
    if (joystickEnabled.value) {
      handleJoystickDisconnect();
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    joystickEnabled.value = false;
    hasPhysicalGamepad.value = false;
    activeGamepad.value = null;
    isVirtualActive.value = true; // Reset to default state
  }

  // Initial gamepad detection on mount
  onMounted(() => {
    const initialGamepads = navigator.getGamepads();
    for (let gamepad of initialGamepads) {
      if (gamepad) {
        hasPhysicalGamepad.value = true;
        activeGamepad.value = gamepad;
        break;
      }
    }

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
  });

  onUnmounted(() => {
    cleanup();
    window.removeEventListener('gamepadconnected', handleGamepadConnected);
    window.removeEventListener(
      'gamepaddisconnected',
      handleGamepadDisconnected
    );
  });

  return {
    joystickEnabled,
    hasPhysicalGamepad,
    isVirtualActive,
    toggleJoystick,
    handleJoystickState,
    cleanup
  };
};
