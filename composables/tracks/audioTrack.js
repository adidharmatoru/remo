import { ref } from 'vue';

export function audioTrack() {
  const audioRef = ref(null);
  const audioStream = ref(null);
  const audioEnabled = ref(true);
  const showInteractPrompt = ref(false);

  const initAudioTrack = async (stream) => {
    if (!stream) {
      console.error('Audio stream not available');
      return false;
    }
    audioStream.value = stream;
    if (audioRef.value) {
      audioRef.value.srcObject = stream;
      try {
        await audioRef.value.play();
        return true;
      } catch (error) {
        console.error('Audio playback failed:', error);
        showInteractPrompt.value = true;
        return false;
      }
    }
    return false;
  };

  const toggleAudio = () => {
    audioEnabled.value = !audioEnabled.value;
    if (audioRef.value) {
      audioRef.value.muted = !audioEnabled.value;
    }
  };

  const retryAudio = async () => {
    try {
      await audioRef.value?.play();
      showInteractPrompt.value = false;
      return true;
    } catch (error) {
      console.error('Audio playback still failed:', error);
      return false;
    }
  };

  const cleanup = () => {
    if (audioRef.value) {
      audioRef.value.srcObject = null;
    }
    audioStream.value = null;
    audioEnabled.value = true;
    showInteractPrompt.value = false;
  };

  return {
    audioRef,
    audioStream,
    audioEnabled,
    showInteractPrompt,
    initAudioTrack,
    toggleAudio,
    retryAudio,
    cleanup
  };
}
