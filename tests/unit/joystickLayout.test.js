import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useJoystickLayout } from '../../composables/controls/joystickLayout';
import { nextTick } from 'vue';

describe('useJoystickLayout', () => {
  let mockStorage = {};

  // Mock localStorage
  beforeEach(() => {
    mockStorage = {};
    /*global global*/
    global.localStorage = {
      getItem: vi.fn((key) => mockStorage[key]),
      setItem: vi.fn((key, value) => {
        mockStorage[key] = value;
      })
    };
  });

  it('should initialize with default positions', () => {
    const {
      leftStickPosition,
      rightStickPosition,
      buttonsPosition,
      triggersPosition
    } = useJoystickLayout();

    expect(leftStickPosition.value).toEqual({ x: 20, y: 70, size: 120 });
    expect(rightStickPosition.value).toEqual({ x: 80, y: 70, size: 120 });
    expect(buttonsPosition.value).toEqual({ x: 80, y: 30, size: 150 });
    expect(triggersPosition.value).toEqual({ x: 20, y: 30, size: 100 });
  });

  it('should load saved layout from localStorage', () => {
    const savedLayout = {
      leftStick: { x: 25, y: 75, size: 125 },
      rightStick: { x: 85, y: 75, size: 125 },
      buttons: { x: 85, y: 35, size: 155 },
      triggers: { x: 25, y: 35, size: 105 }
    };
    mockStorage['virtualJoystickLayout'] = JSON.stringify(savedLayout);

    const {
      leftStickPosition,
      rightStickPosition,
      buttonsPosition,
      triggersPosition,
      loadLayout
    } = useJoystickLayout();
    loadLayout();

    expect(leftStickPosition.value).toEqual(savedLayout.leftStick);
    expect(rightStickPosition.value).toEqual(savedLayout.rightStick);
    expect(buttonsPosition.value).toEqual(savedLayout.buttons);
    expect(triggersPosition.value).toEqual(savedLayout.triggers);
  });

  it('should save layout to localStorage when positions change', async () => {
    const {
      leftStickPosition,
      rightStickPosition,
      buttonsPosition,
      triggersPosition
    } = useJoystickLayout();

    const newLayout = {
      leftStick: { x: 30, y: 80, size: 130 },
      rightStick: { x: 90, y: 80, size: 130 },
      buttons: { x: 90, y: 40, size: 160 },
      triggers: { x: 30, y: 40, size: 110 }
    };

    // Modify positions
    leftStickPosition.value = newLayout.leftStick;
    await nextTick();
    rightStickPosition.value = newLayout.rightStick;
    await nextTick();
    buttonsPosition.value = newLayout.buttons;
    await nextTick();
    triggersPosition.value = newLayout.triggers;
    await nextTick();

    const expectedSavedLayout = {
      leftStick: newLayout.leftStick,
      rightStick: newLayout.rightStick,
      buttons: newLayout.buttons,
      triggers: newLayout.triggers
    };

    // Verify localStorage was called with the correct data
    const lastCall = localStorage.setItem.mock.lastCall;
    expect(lastCall[0]).toBe('virtualJoystickLayout');
    expect(JSON.parse(lastCall[1])).toEqual(expectedSavedLayout);
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock localStorage.getItem to throw an error
    global.localStorage.getItem = vi.fn(() => {
      throw new Error('Storage error');
    });

    const { loadLayout } = useJoystickLayout();
    loadLayout();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error loading joystick layout:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
