import { describe, it, expect, vi, beforeEach } from 'vitest';
import { audioTrack } from '../../composables/tracks/audioTrack';

describe('audioTrack', () => {
  let audio;

  beforeEach(() => {
    audio = audioTrack();
  });

  it('should initialize with default values', () => {
    expect(audio.audioRef.value).toBe(null);
    expect(audio.audioStream.value).toBe(null);
    expect(audio.audioEnabled.value).toBe(true);
    expect(audio.showInteractPrompt.value).toBe(false);
  });

  it('should toggle audio', () => {
    const mockAudioElement = { muted: false };
    audio.audioRef.value = mockAudioElement;

    audio.toggleAudio();

    expect(audio.audioEnabled.value).toBe(false);
    expect(mockAudioElement.muted).toBe(true);

    audio.toggleAudio();

    expect(audio.audioEnabled.value).toBe(true);
    expect(mockAudioElement.muted).toBe(false);
  });

  it('should retry audio playback', async () => {
    const mockAudioElement = {
      play: vi.fn().mockResolvedValue(undefined)
    };
    audio.audioRef.value = mockAudioElement;
    audio.showInteractPrompt.value = true;

    const result = await audio.retryAudio();

    expect(result).toBe(true);
    expect(mockAudioElement.play).toHaveBeenCalled();
    expect(audio.showInteractPrompt.value).toBe(false);
  });

  it('should clean up', () => {
    const mockAudioElement = { srcObject: 'mockStream' };
    audio.audioRef.value = mockAudioElement;
    audio.audioStream.value = 'mockStream';
    audio.audioEnabled.value = false;
    audio.showInteractPrompt.value = true;

    audio.cleanup();

    expect(mockAudioElement.srcObject).toBe(null);
    expect(audio.audioStream.value).toBe(null);
    expect(audio.audioEnabled.value).toBe(true);
    expect(audio.showInteractPrompt.value).toBe(false);
  });
});
