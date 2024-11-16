import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mouseControl } from '../../composables/controls/mouseControl';

describe('mouseControl', () => {
  let mouse;
  let mockVideoRef;
  let mockEventChannel;

  beforeEach(() => {
    mockVideoRef = { value: { getBoundingClientRect: vi.fn() } };
    mockEventChannel = { value: { readyState: 'open', send: vi.fn() } };
    mouse = mouseControl(mockVideoRef, mockEventChannel);
  });

  it('should initialize with default values', () => {
    expect(mouse.mouseEnabled.value).toBe(false);
    expect(mouse.mouseTrackEnabled.value).toBe(false);
    expect(mouse.isPointerLocked.value).toBe(false);
  });
});
