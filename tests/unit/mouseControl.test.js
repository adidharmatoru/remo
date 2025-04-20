import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mouseControl } from '../../composables/controls/mouseControl';
import { EventType } from '../../composables/controls/binarySerializer';

describe('mouseControl', () => {
  let mouse;
  let mockVideoRef;
  let mockEventChannel;

  beforeEach(() => {
    mockVideoRef = {
      value: {
        getBoundingClientRect: vi.fn().mockReturnValue({
          width: 1920,
          height: 1080,
          left: 0,
          top: 0
        }),
        offsetWidth: 1920,
        offsetHeight: 1080,
        videoWidth: 1920,
        videoHeight: 1080
      }
    };
    mockEventChannel = {
      value: {
        readyState: 'open',
        send: vi.fn()
      }
    };
    mouse = mouseControl(mockVideoRef, mockEventChannel);
  });

  it('should initialize with default values', () => {
    expect(mouse.mouseEnabled.value).toBe(false);
    expect(mouse.mouseTrackEnabled.value).toBe(false);
    expect(mouse.isPointerLocked.value).toBe(false);
  });

  it('should toggle mouse control', () => {
    mouse.toggleMouse();
    expect(mouse.mouseEnabled.value).toBe(true);

    mouse.toggleMouse();
    expect(mouse.mouseEnabled.value).toBe(false);
  });

  it('should clean up properly', () => {
    mouse.mouseEnabled.value = true;
    mouse.mouseTrackEnabled.value = true;
    mouse.isPointerLocked.value = true;

    mouse.cleanup();

    expect(mouse.mouseEnabled.value).toBe(false);
    expect(mouse.mouseTrackEnabled.value).toBe(false);
    expect(mouse.isPointerLocked.value).toBe(false);
  });

  /*global global*/
  /*global afterEach*/
  describe('touch controls', () => {
    beforeEach(() => {
      mouse.mouseEnabled.value = true;
      vi.useFakeTimers();
      // Mock document.body methods for keyboard tests
      global.document.body.appendChild = vi.fn();
      global.document.body.removeChild = vi.fn();
      global.document.body.contains = vi.fn().mockReturnValue(true);
      // Mock Date.now() for timing tests
      vi.spyOn(Date, 'now').mockImplementation(() => 0);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.clearAllMocks();
    });

    it('should handle single finger tap as left click', async () => {
      // Simulate touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 100,
            clientY: 100
          }
        ]
      });

      // Simulate touch end within tap threshold
      Date.now.mockImplementation(() => 100); // Within 300ms threshold
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [
          {
            clientX: 100,
            clientY: 100
          }
        ],
        touches: []
      });

      mouse.updateMouseListeners();
      mockVideoRef.value.ontouchstart(touchStartEvent);
      mockVideoRef.value.ontouchend(touchEndEvent);

      // Wait for the setTimeout to complete
      await vi.runAllTimersAsync();

      expect(mockEventChannel.value.send).toHaveBeenCalledTimes(2);
      const calls = mockEventChannel.value.send.mock.calls;

      // Check mouse down event
      const mouseDownData = calls[0][0];
      expect(mouseDownData instanceof Uint8Array).toBe(true);
      expect(mouseDownData[0]).toBe(EventType.MOUSE_DOWN);
      expect(mouseDownData[3]).toBe(0);

      // Check mouse up event
      const mouseUpData = calls[1][0];
      expect(mouseUpData instanceof Uint8Array).toBe(true);
      expect(mouseUpData[0]).toBe(EventType.MOUSE_UP);
      expect(mouseUpData[3]).toBe(0);
    });

    it('should handle two finger tap as right click', async () => {
      // Reset Date.now mock for this test
      vi.spyOn(Date, 'now').mockImplementation(() => 0);

      // Simulate touch start with two fingers
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 120, clientY: 100 }
        ]
      });

      mouse.updateMouseListeners();
      mockVideoRef.value.ontouchstart(touchStartEvent);

      // Simulate touch end within tap threshold
      Date.now.mockImplementation(() => 100); // Within 300ms threshold
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [
          {
            clientX: 100,
            clientY: 100
          }
        ],
        touches: []
      });

      mockVideoRef.value.ontouchend(touchEndEvent);

      // Wait for the setTimeout to complete
      await vi.runAllTimersAsync();

      expect(mockEventChannel.value.send).toHaveBeenCalledTimes(2);
      const calls = mockEventChannel.value.send.mock.calls;

      // Check mouse down event
      const mouseDownData = calls[0][0];
      expect(mouseDownData instanceof Uint8Array).toBe(true);
      expect(mouseDownData[0]).toBe(EventType.MOUSE_DOWN);
      expect(mouseDownData[3]).toBe(0);

      // Check mouse up event
      const mouseUpData = calls[1][0];
      expect(mouseUpData instanceof Uint8Array).toBe(true);
      expect(mouseUpData[0]).toBe(EventType.MOUSE_UP);
      expect(mouseUpData[3]).toBe(0);
    });

    it('should handle two finger scroll', async () => {
      // Simulate touch start with two fingers
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 120, clientY: 100 }
        ]
      });

      mouse.updateMouseListeners();
      mockVideoRef.value.ontouchstart(touchStartEvent);

      // Simulate touch move for scrolling
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          { clientX: 100, clientY: 120 },
          { clientX: 120, clientY: 120 }
        ]
      });

      mockVideoRef.value.ontouchmove(touchMoveEvent);

      expect(mockEventChannel.value.send).toHaveBeenCalled();
      const scrollData = mockEventChannel.value.send.mock.calls[0][0];
      expect(scrollData instanceof Uint8Array).toBe(true);
      expect(scrollData[0]).toBe(EventType.MOUSE_WHEEL);
      expect(scrollData[3]).toBe(0); // deltaX
      expect(scrollData[4]).toBe(0); // deltaY
    });

    it('should not trigger right click after scrolling with two fingers', async () => {
      // Simulate touch start with two fingers
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 120, clientY: 100 }
        ]
      });

      mouse.updateMouseListeners();
      mockVideoRef.value.ontouchstart(touchStartEvent);

      // Simulate touch move for scrolling
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          { clientX: 100, clientY: 120 },
          { clientX: 120, clientY: 120 }
        ]
      });

      mockVideoRef.value.ontouchmove(touchMoveEvent);

      // Simulate touch end
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 120 }],
        touches: []
      });

      mockVideoRef.value.ontouchend(touchEndEvent);

      // Wait for any timeouts
      await vi.runAllTimersAsync();

      const calls = mockEventChannel.value.send.mock.calls;
      const lastCall = calls[calls.length - 1][0];

      // Verify the last event was not a right click
      expect(lastCall[0]).not.toBe(EventType.MOUSE_DOWN);
      expect(lastCall[0]).not.toBe(EventType.MOUSE_UP);
    });
  });
});
