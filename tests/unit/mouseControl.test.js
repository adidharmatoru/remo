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
        })
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
});
