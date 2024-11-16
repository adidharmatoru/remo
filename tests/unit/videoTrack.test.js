import { describe, it, expect, beforeEach } from 'vitest';
import { videoTrack } from '../../composables/tracks/videoTrack';

describe('videoTrack', () => {
  let video;

  beforeEach(() => {
    video = videoTrack();
  });

  it('should initialize with default values', () => {
    expect(video.videoRef.value).toBe(null);
    expect(video.videoStream.value).toBe(null);
    expect(video.isFullscreen.value).toBe(false);
  });
});
