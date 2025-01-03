import { describe, it, expect, vi, beforeEach } from 'vitest';
import { videoTrack } from '../../composables/tracks/videoTrack';

describe('videoTrack', () => {
  let video;

  beforeEach(() => {
    video = videoTrack();
    document.exitFullscreen = vi.fn();
    document.documentElement.requestFullscreen = vi.fn();
  });

  it('should initialize with default values', () => {
    expect(video.videoRef.value).toBe(null);
    expect(video.videoStream.value).toBe(null);
    expect(video.isFullscreen.value).toBe(false);
  });

  it('should toggle fullscreen', async () => {
    await video.toggleFullscreen();
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled();

    video.isFullscreen.value = true;
    await video.toggleFullscreen();
    expect(document.exitFullscreen).toHaveBeenCalled();
  });

  it('should handle fullscreen change events', () => {
    const cleanup = video.setupFullscreenListeners();
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(video.isFullscreen.value).toBe(false);
    cleanup();
  });
});
