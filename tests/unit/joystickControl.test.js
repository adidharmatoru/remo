import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joystickControl } from '../../composables/controls/joystickControl';

describe('joystickControl', () => {
  let joystick;
  let mockEventChannel;
  let mockGamepad;
  let mockLocalStorage;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(JSON.stringify({ id: 'test-user-id' }))
    };
    /*global global*/
    global.localStorage = mockLocalStorage;

    // Mock requestAnimationFrame and cancelAnimationFrame
    global.requestAnimationFrame = vi.fn();
    global.cancelAnimationFrame = vi.fn();

    // Mock gamepad
    mockGamepad = {
      axes: [0.5, -0.5, 0.2, -0.2],
      buttons: Array(17)
        .fill()
        .map(() => ({ pressed: false, value: 0 })),
      index: 0
    };

    // Mock navigator.getGamepads()
    global.navigator.getGamepads = vi.fn().mockReturnValue([mockGamepad]);

    // Mock event channel
    mockEventChannel = {
      value: {
        readyState: 'open',
        send: vi.fn()
      }
    };

    joystick = joystickControl(mockEventChannel);
  });

  /*global afterEach*/
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    expect(joystick.joystickEnabled.value).toBe(false);
    // expect(joystick.hasPhysicalGamepad.value).toBe(true); // True because of initial gamepad detection
    expect(joystick.isVirtualActive.value).toBe(true);
  });

  it('should handle failed localStorage access', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    joystick = joystickControl(mockEventChannel);
    expect(mockEventChannel.value.send).not.toHaveBeenCalled();
  });

  it('should handle gamepad connection', () => {
    const event = { gamepad: mockGamepad };
    joystick.joystickEnabled.value = true;

    // Simulate gamepad connection
    window.dispatchEvent(
      new CustomEvent('gamepadconnected', { detail: event })
    );

    // expect(joystick.hasPhysicalGamepad.value).toBe(true);
    expect(joystick.isVirtualActive.value).toBe(true);
  });

  it('should handle gamepad disconnection', () => {
    joystick.joystickEnabled.value = true;

    // Simulate gamepad disconnection
    window.dispatchEvent(new CustomEvent('gamepaddisconnected'));

    expect(joystick.hasPhysicalGamepad.value).toBe(false);
    expect(joystick.isVirtualActive.value).toBe(true);
  });

  it('should toggle joystick control', () => {
    joystick.toggleJoystick();
    expect(joystick.joystickEnabled.value).toBe(true);

    const connectData = mockEventChannel.value.send.mock.calls[0][0];
    expect(connectData instanceof Uint8Array).toBe(true);
    expect(connectData[0]).toBe(7); // gamepad_connect type
    expect(String.fromCharCode(...connectData.slice(3))).toBe('test-user-id');

    joystick.toggleJoystick();
    expect(joystick.joystickEnabled.value).toBe(false);

    const disconnectData = mockEventChannel.value.send.mock.calls[1][0];
    expect(disconnectData instanceof Uint8Array).toBe(true);
    expect(disconnectData[0]).toBe(8); // gamepad_disconnect type
  });

  it('should handle virtual joystick state', () => {
    const mockState = {
      axes: {
        left_stick_x: 100,
        left_stick_y: -100,
        right_stick_x: 200,
        right_stick_y: -200,
        left_trigger: 128,
        right_trigger: 255
      },
      buttons: {
        a: true,
        b: false
      }
    };

    joystick.handleJoystickState(mockState);

    const sentData = mockEventChannel.value.send.mock.calls[0][0];
    expect(sentData instanceof Uint8Array).toBe(true);
    expect(sentData[0]).toBe(9); // gamepad_state type

    // Check user ID in the binary data
    const userId = String.fromCharCode(...sentData.slice(3, 15));
    expect(userId).toBe('test-user-id');

    // Check axes values in binary format
    expect(sentData[15]).toBe(1); // Button state (a pressed)
    expect(sentData[16]).toBe(0); // Button state (b not pressed)
    expect(sentData[17]).toBe(100); // left_stick_x
    expect(sentData[18]).toBe(0);
    expect(sentData[19]).toBe(-100 & 0xff); // left_stick_y
    expect(sentData[20]).toBe(0xff);
    expect(sentData[21]).toBe(200); // right_stick_x
    expect(sentData[22]).toBe(0);
    expect(sentData[23]).toBe(-200 & 0xff); // right_stick_y
    expect(sentData[24]).toBe(0xff);
    expect(sentData[25]).toBe(128); // left_trigger
    expect(sentData[26]).toBe(255); // right_trigger
  });

  it('should handle event channel not ready', () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    mockEventChannel.value.readyState = 'closed';

    joystick.handleJoystickState({
      axes: {},
      buttons: {}
    });

    expect(consoleSpy).toHaveBeenCalledWith('Event channel not ready');
  });

  it('should cleanup properly', () => {
    joystick.joystickEnabled.value = true;
    joystick.hasPhysicalGamepad.value = true;

    joystick.cleanup();

    expect(joystick.joystickEnabled.value).toBe(false);
    expect(joystick.hasPhysicalGamepad.value).toBe(false);
    expect(joystick.isVirtualActive.value).toBe(true);
    // expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });
});
