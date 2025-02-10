import { describe, it, expect, vi, beforeEach } from 'vitest';
import { audioTrack } from '../../composables/tracks/audioTrack';

describe('audioTrack', () => {
  let audio;
  const mockStream = { id: 'test-stream' };
  const mockAudioElement = {
    srcObject: null,
    play: vi.fn(),
    muted: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    audio = audioTrack();
    audio.audioRef.value = mockAudioElement;
  });

  it('should handle failed audio track initialization', async () => {
    mockAudioElement.play.mockRejectedValue(new Error('Playback failed'));
    const result = await audio.initAudioTrack(mockStream);

    expect(result).toBe(false);
    expect(audio.showInteractPrompt.value).toBe(true);
  });

  it('should handle null stream during initialization', async () => {
    const result = await audio.initAudioTrack(null);
    expect(result).toBe(false);
  });

  it('should toggle audio correctly', () => {
    audio.toggleAudio();
    expect(audio.audioEnabled.value).toBe(false);
    expect(mockAudioElement.muted).toBe(true);

    audio.toggleAudio();
    expect(audio.audioEnabled.value).toBe(true);
    expect(mockAudioElement.muted).toBe(false);
  });

  it('should handle successful audio retry', async () => {
    mockAudioElement.play.mockResolvedValue(undefined);
    audio.showInteractPrompt.value = true;

    const result = await audio.retryAudio();
    expect(result).toBe(true);
    expect(audio.showInteractPrompt.value).toBe(false);
  });

  it('should handle failed audio retry', async () => {
    mockAudioElement.play.mockRejectedValue(new Error('Playback failed'));
    audio.showInteractPrompt.value = true;

    const result = await audio.retryAudio();
    expect(result).toBe(false);
    expect(audio.showInteractPrompt.value).toBe(true);
  });

  it('should clean up resources properly', () => {
    audio.audioStream.value = mockStream;
    audio.audioEnabled.value = false;
    audio.showInteractPrompt.value = true;

    audio.cleanup();

    expect(audio.audioRef.value.srcObject).toBeNull();
    expect(audio.audioStream.value).toBeNull();
    expect(audio.audioEnabled.value).toBe(true);
    expect(audio.showInteractPrompt.value).toBe(false);
  });
});
