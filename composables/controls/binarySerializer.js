// Event type constants
export const EventType = {
  KEY_DOWN: 1,
  KEY_UP: 2,
  MOUSE_MOVE: 3,
  MOUSE_DOWN: 4,
  MOUSE_UP: 5,
  MOUSE_WHEEL: 6,
  GAMEPAD_CONNECT: 7,
  GAMEPAD_DISCONNECT: 8,
  GAMEPAD_STATE: 9
};

// Mouse button mapping
export const MouseButton = {
  LEFT: 1,
  MIDDLE: 2,
  RIGHT: 3
};

// Convert string to bytes with length prefix
function stringToBytes(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const lenBytes = new Uint8Array(2);
  const view = new DataView(lenBytes.buffer);
  view.setUint16(0, bytes.length, true); // true for little-endian
  return new Uint8Array([...lenBytes, ...bytes]);
}

// Convert number to bytes
function numberToBytes(num, type) {
  const buffer = new ArrayBuffer(type === 'i32' ? 4 : 2);
  const view = new DataView(buffer);
  if (type === 'i32') {
    view.setInt32(0, num, true); // true for little-endian
  } else if (type === 'i16') {
    view.setInt16(0, num, true);
  }
  return new Uint8Array(buffer);
}

export function serializeKeyEvent(type, key) {
  const bytes = [type]; // EventType.KEY_DOWN or EventType.KEY_UP
  return new Uint8Array([...bytes, ...stringToBytes(key)]);
}

export function serializeMouseMoveEvent(x, y, absolute) {
  return new Uint8Array([
    EventType.MOUSE_MOVE,
    ...numberToBytes(x, 'i32'),
    ...numberToBytes(y, 'i32'),
    absolute ? 1 : 0
  ]);
}

export function serializeMouseButtonEvent(type, x, y, button) {
  return new Uint8Array([
    type, // EventType.MOUSE_DOWN or EventType.MOUSE_UP
    ...numberToBytes(x, 'i32'),
    ...numberToBytes(y, 'i32'),
    MouseButton[button.toUpperCase()]
  ]);
}

export function serializeMouseWheelEvent(x, y) {
  return new Uint8Array([
    EventType.MOUSE_WHEEL,
    ...numberToBytes(x, 'i32'),
    ...numberToBytes(y, 'i32')
  ]);
}

export function serializeGamepadConnectEvent(type, id) {
  return new Uint8Array([type, ...stringToBytes(id)]);
}

export function serializeGamepadStateEvent(id, state) {
  // Calculate buttons bitfield
  let buttons = 0;
  if (state.buttons.a) buttons |= 1 << 0;
  if (state.buttons.b) buttons |= 1 << 1;
  if (state.buttons.x) buttons |= 1 << 2;
  if (state.buttons.y) buttons |= 1 << 3;
  if (state.buttons.lb) buttons |= 1 << 4;
  if (state.buttons.rb) buttons |= 1 << 5;
  if (state.buttons.start) buttons |= 1 << 6;
  if (state.buttons.back) buttons |= 1 << 7;
  if (state.buttons.guide) buttons |= 1 << 8;
  if (state.buttons.left_stick) buttons |= 1 << 9;
  if (state.buttons.right_stick) buttons |= 1 << 10;
  if (state.buttons.dpad_up) buttons |= 1 << 11;
  if (state.buttons.dpad_down) buttons |= 1 << 12;
  if (state.buttons.dpad_left) buttons |= 1 << 13;
  if (state.buttons.dpad_right) buttons |= 1 << 14;

  // Create the final byte array in the exact order:
  // 1. Event type (1 byte)
  // 2. ID length + ID string
  // 3. Buttons (2 bytes)
  // 4. Axes (12 bytes: 4 x i16 + 2 x u8)
  const idBytes = stringToBytes(id);
  const buttonBytes = numberToBytes(buttons, 'i16');
  const leftStickX = numberToBytes(state.axes.left_stick_x, 'i16');
  const leftStickY = numberToBytes(state.axes.left_stick_y, 'i16');
  const rightStickX = numberToBytes(state.axes.right_stick_x, 'i16');
  const rightStickY = numberToBytes(state.axes.right_stick_y, 'i16');

  // Combine all parts
  return new Uint8Array([
    EventType.GAMEPAD_STATE,
    ...idBytes,
    ...buttonBytes,
    ...leftStickX,
    ...leftStickY,
    ...rightStickX,
    ...rightStickY,
    state.axes.left_trigger,
    state.axes.right_trigger,
    0,
    0 // Add padding to ensure we have at least 14 bytes after ID
  ]);
}

// Helper function to send binary data through WebRTC data channel
export function sendBinaryData(channel, data) {
  if (channel?.readyState === 'open') {
    try {
      channel.send(data);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// Helper function to send event data in binary format
export function sendEventData(channel, data) {
  if (!channel || channel.readyState !== 'open') {
    console.warn('Event channel not ready');
    return false;
  }

  let binaryData;
  switch (data.type) {
    case 'key_down':
      binaryData = serializeKeyEvent(EventType.KEY_DOWN, data.key);
      break;
    case 'key_up':
      binaryData = serializeKeyEvent(EventType.KEY_UP, data.key);
      break;
    case 'mouse_move':
      binaryData = serializeMouseMoveEvent(data.x, data.y, data.absolute);
      break;
    case 'mouse_down':
      binaryData = serializeMouseButtonEvent(
        EventType.MOUSE_DOWN,
        data.x,
        data.y,
        data.button
      );
      break;
    case 'mouse_up':
      binaryData = serializeMouseButtonEvent(
        EventType.MOUSE_UP,
        data.x,
        data.y,
        data.button
      );
      break;
    case 'mouse_wheel':
      binaryData = serializeMouseWheelEvent(data.x, data.y);
      break;
    case 'gamepad_connect':
      binaryData = serializeGamepadConnectEvent(
        EventType.GAMEPAD_CONNECT,
        data.id
      );
      break;
    case 'gamepad_disconnect':
      binaryData = serializeGamepadConnectEvent(
        EventType.GAMEPAD_DISCONNECT,
        data.id
      );
      break;
    case 'gamepad_state':
      binaryData = serializeGamepadStateEvent(data.id, data.state);
      break;
    default:
      return false;
  }

  return sendBinaryData(channel, binaryData);
}
