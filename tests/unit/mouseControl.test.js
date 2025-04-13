import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mouseControl } from '../../composables/controls/mouseControl';

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
      const calls = mockEventChannel.value.send.mock.calls.map((call) =>
        JSON.parse(call[0])
      );

      expect(calls[0]).toMatchObject({
        type: 'mouse_down',
        button: 'left'
      });
      expect(calls[1]).toMatchObject({
        type: 'mouse_up',
        button: 'left'
      });
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
      const calls = mockEventChannel.value.send.mock.calls.map((call) =>
        JSON.parse(call[0])
      );

      expect(calls[0]).toMatchObject({
        type: 'mouse_down',
        button: 'right'
      });
      expect(calls[1]).toMatchObject({
        type: 'mouse_up',
        button: 'right'
      });
    });

    it('should not trigger tap if movement exceeds threshold', async () => {
      // Reset Date.now mock for this test
      vi.spyOn(Date, 'now').mockImplementation(() => 0);

      // Simulate touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 100,
            clientY: 100
          }
        ]
      });

      mouse.updateMouseListeners();
      mockVideoRef.value.ontouchstart(touchStartEvent);

      // Simulate touch move exceeding threshold
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          {
            clientX: 100,
            clientY: 120 // Movement of 20px exceeds 10px threshold
          }
        ]
      });

      mockVideoRef.value.ontouchmove(touchMoveEvent);

      // Clear any movement events before testing tap
      vi.clearAllMocks();

      // Simulate touch end
      Date.now.mockImplementation(() => 100);
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [
          {
            clientX: 100,
            clientY: 120
          }
        ],
        touches: []
      });

      mockVideoRef.value.ontouchend(touchEndEvent);
      await vi.runAllTimersAsync();

      // Should not trigger tap events
      expect(mockEventChannel.value.send).not.toHaveBeenCalled();
    });

    it('should not trigger tap if duration exceeds threshold', async () => {
      // Reset Date.now mock for this test
      vi.spyOn(Date, 'now').mockImplementation(() => 0);

      // Simulate touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 100,
            clientY: 100
          }
        ]
      });

      mouse.updateMouseListeners();
      mockVideoRef.value.ontouchstart(touchStartEvent);

      // Simulate touch end after threshold
      Date.now.mockImplementation(() => 400); // Exceeds 300ms threshold
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
      await vi.runAllTimersAsync();
      expect(mockEventChannel.value.send).not.toHaveBeenCalled();
    });

    it('should toggle virtual keyboard on three finger tap', async () => {
      // Simulate touch start with three fingers
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 120, clientY: 100 },
          { clientX: 140, clientY: 100 }
        ]
      });

      // Simulate touch end within tap threshold
      Date.now.mockImplementation(() => 100);
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

      // First three-finger tap should show keyboard
      mockVideoRef.value.ontouchstart(touchStartEvent);
      mockVideoRef.value.ontouchend(touchEndEvent);

      const inputElement = document.body.appendChild.mock.calls[0][0];
      expect(document.body.appendChild).toHaveBeenCalledWith(inputElement);
      expect(document.body.removeChild).not.toHaveBeenCalled();

      // Reset call counts
      vi.clearAllMocks();

      // Second three-finger tap should hide keyboard
      mockVideoRef.value.ontouchstart(touchStartEvent);
      mockVideoRef.value.ontouchend(touchEndEvent);
      expect(document.body.removeChild).toHaveBeenCalledWith(inputElement);
    });

    it('should not handle touch events when mouse is disabled', () => {
      mouse.mouseEnabled.value = false;
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 100,
            clientY: 100
          }
        ]
      });

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
      mockVideoRef.value.ontouchstart?.(touchStartEvent);
      mockVideoRef.value.ontouchend?.(touchEndEvent);

      expect(mockEventChannel.value.send).not.toHaveBeenCalled();
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

      // Simulate touch move with two fingers
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          { clientX: 100, clientY: 120 },
          { clientX: 120, clientY: 120 }
        ]
      });

      mockVideoRef.value.ontouchmove(touchMoveEvent);

      expect(mockEventChannel.value.send).toHaveBeenCalled();
      const scrollEvent = JSON.parse(
        mockEventChannel.value.send.mock.calls[0][0]
      );

      expect(scrollEvent).toMatchObject({
        type: 'mouse_wheel',
        x: 0
      });
      expect(scrollEvent.y).toBeDefined();
    });

    it('should not trigger right click after scrolling with two fingers', async () => {
      // Start with two fingers
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 120, clientY: 100 }
        ]
      });

      mouse.updateMouseListeners();
      mockVideoRef.value.ontouchstart(touchStartEvent);

      // Move with two fingers
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          { clientX: 100, clientY: 120 },
          { clientX: 120, clientY: 120 }
        ]
      });

      mockVideoRef.value.ontouchmove(touchMoveEvent);

      // End touch with two fingers
      Date.now.mockImplementation(() => 100);
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 120 }],
        touches: []
      });

      mockVideoRef.value.ontouchend(touchEndEvent);

      const calls = mockEventChannel.value.send.mock.calls.map((call) =>
        JSON.parse(call[0])
      );

      // Should only see wheel events, no mouse down/up events
      expect(calls.every((call) => call.type === 'mouse_wheel')).toBe(true);
    });
  });
});
