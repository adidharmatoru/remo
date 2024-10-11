import { ref } from 'vue';

export function videoTrack() {
  const videoRef = ref(null);
  const videoStream = ref(null);
  const isFullscreen = ref(false);

  const initVideoTrack = (stream) => {
    if (!stream) {
      console.error('Video stream not available');
      return false;
    }
    videoStream.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
    return true;
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen.value) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error('Error entering fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
  };

  const setupFullscreenListeners = () => {
    const fullscreenChangeHandler = () => {
      isFullscreen.value = Boolean(
        document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    document.addEventListener(
      'webkitfullscreenchange',
      fullscreenChangeHandler
    );
    document.addEventListener('msfullscreenchange', fullscreenChangeHandler);

    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
      document.removeEventListener(
        'webkitfullscreenchange',
        fullscreenChangeHandler
      );
      document.removeEventListener(
        'msfullscreenchange',
        fullscreenChangeHandler
      );
    };
  };

  const cleanup = () => {
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .catch((err) => console.error('Error exiting fullscreen:', err));
    }
    if (videoRef.value) {
      videoRef.value.srcObject = null;
    }
    videoStream.value = null;
  };

  return {
    videoRef,
    videoStream,
    isFullscreen,
    initVideoTrack,
    toggleFullscreen,
    setupFullscreenListeners,
    cleanup
  };
}
