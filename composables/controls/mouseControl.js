import { ref } from 'vue';

export const mouseControl = (videoRef, eventChannel) => {
  const mouseEnabled = ref(false);
  const mouseTrackEnabled = ref(false);
  const isPointerLocked = ref(false);

  const ButtonName = ['left', 'middle', 'right'];

  const sendEventData = (data) => {
    if (eventChannel.value && eventChannel.value.readyState === 'open') {
      eventChannel.value.send(JSON.stringify(data));
    } else {
      console.warn('Event channel not ready');
    }
  };

  const toSharerCoordinate = (event) => {
    const video = videoRef.value;
    const rect = video.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const viewW = video.offsetWidth;
    const viewH = video.offsetHeight;
    const videoW = video.videoWidth;
    const videoH = video.videoHeight;

    if (viewH / viewW > videoH / videoW) {
      const scale = viewW / videoW;
      const x = mouseX / scale;
      const y = (mouseY - (viewH - videoH * scale) / 2) / scale;
      return { x: Math.round(x), y: Math.round(y) };
    } else {
      const scale = viewH / videoH;
      const x = (mouseX - (viewW - videoW * scale) / 2) / scale;
      const y = mouseY / scale;
      return { x: Math.round(x), y: Math.round(y) };
    }
  };

  const onVideoMouse = (action) => (event) => {
    if (!mouseEnabled.value) return;
    event.preventDefault();

    const video = videoRef.value;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    if (action === 'mouse_move' && !mouseTrackEnabled.value && !event.buttons)
      return;

    const coords = toSharerCoordinate(event);
    const eventData = {
      type: action,
      ...coords,
      dx: 0,
      dy: 0,
      ...(action !== 'mouse_move' ? { button: ButtonName[event.button] } : {})
    };

    sendEventData(eventData);
  };

  const onVideoWheel = (event) => {
    if (!mouseEnabled.value) return;
    event.preventDefault();

    const video = videoRef.value;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const sensitivity = 1;
    const deltaX = event.deltaX ? event.deltaX : event.wheelDeltaX;
    const deltaY = event.deltaY ? event.deltaY : -event.wheelDelta;

    sendEventData({
      type: 'mouse_wheel',
      x: parseInt(deltaX, 10),
      y: parseInt(deltaY / sensitivity, 10)
    });
  };

  let onMouseMove = (event) => {
    if (document.pointerLockElement === videoRef.value) {
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      sendEventData({
        type: 'mouse_move',
        dx: movementX,
        dy: movementY,
        x: 0,
        y: 0
      });
    }
  };

  const toggleMouseTrack = () => {
    mouseTrackEnabled.value = !mouseTrackEnabled.value;
  };

  const toggleMouse = () => {
    mouseEnabled.value = !mouseEnabled.value;
    toggleMouseTrack();
    updateMouseListeners();
  };

  // Add pointer lock change and error event listeners
  const handlePointerLockChange = () => {
    isPointerLocked.value = document.pointerLockElement === videoRef.value;
    if (!isPointerLocked.value) {
      document.removeEventListener('mousemove', onMouseMove, false);
    }
  };

  const handlePointerLockError = (error) => {
    console.error('Pointer lock error:', error);
    isPointerLocked.value = false;
    // Fall back to regular mouse tracking
    if (!mouseTrackEnabled.value) {
      toggleMouseTrack();
    }
  };

  const initPointerLockListeners = () => {
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
  };

  const removePointerLockListeners = () => {
    document.removeEventListener('pointerlockchange', handlePointerLockChange);
    document.removeEventListener('pointerlockerror', handlePointerLockError);
  };

  const toggleMouseLock = async () => {
    try {
      if (!isPointerLocked.value) {
        // Ensure video element is ready
        if (!videoRef.value || !videoRef.value.requestPointerLock) {
          throw new Error('Video element not ready for pointer lock');
        }

        await videoRef.value.requestPointerLock();
        document.addEventListener('mousemove', onMouseMove, false);
      } else {
        document.exitPointerLock();
        document.removeEventListener('mousemove', onMouseMove, false);
      }
    } catch (error) {
      console.error('Pointer lock toggle failed:', error);
      // Fall back to regular mouse tracking
      if (!mouseTrackEnabled.value) {
        toggleMouseTrack();
      }
    }
  };

  const updateMouseListeners = () => {
    if (!videoRef.value) return;

    if (mouseEnabled.value) {
      videoRef.value.onmouseup = onVideoMouse('mouse_up');
      videoRef.value.onmousedown = onVideoMouse('mouse_down');
      videoRef.value.onmousemove = onVideoMouse('mouse_move');
      videoRef.value.onwheel = onVideoWheel;
      document.oncontextmenu = () => false;
      // Initialize pointer lock listeners
      initPointerLockListeners();
    } else {
      videoRef.value.onmouseup = null;
      videoRef.value.onmousedown = null;
      videoRef.value.onmousemove = null;
      videoRef.value.onwheel = null;
      document.oncontextmenu = null;
      // Remove pointer lock listeners
      removePointerLockListeners();
    }
  };

  const cleanup = () => {
    mouseEnabled.value = false;
    mouseTrackEnabled.value = false;
    isPointerLocked.value = false;
    document.oncontextmenu = null;
    updateMouseListeners();
    document.removeEventListener('mousemove', onMouseMove);
    removePointerLockListeners();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  };

  // Initialize pointer lock listeners on creation
  initPointerLockListeners();

  return {
    mouseEnabled,
    mouseTrackEnabled,
    isPointerLocked,
    toggleMouse,
    toggleMouseLock,
    onVideoMouse,
    onVideoWheel,
    updateMouseListeners,
    cleanup
  };
};
