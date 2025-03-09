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

  const toCoordinate = (event) => {
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
    // Only send button events when the mouse is locked
    if (
      action === 'mouse_move' &&
      document.pointerLockElement === videoRef.value
    )
      return;
    event.preventDefault();

    const video = videoRef.value;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    if (action === 'mouse_move' && !mouseTrackEnabled.value && !event.buttons)
      return;

    const coords = toCoordinate(event);
    const eventData = {
      type: action,
      ...coords,
      absolute: true,
      ...(action !== 'mouse_move' ? { button: ButtonName[event.button] } : {})
    };

    sendEventData(eventData);
  };

  const onVideoWheel = (event) => {
    if (!mouseEnabled.value) return;
    event.preventDefault();

    const video = videoRef.value;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const sensitivity = 32;
    const deltaX = event.deltaX ? event.deltaX : event.wheelDeltaX;
    const deltaY = event.deltaY ? event.deltaY : -event.wheelDelta;

    sendEventData({
      type: 'mouse_wheel',
      x: Math.round(deltaX / sensitivity),
      y: Math.round(deltaY / sensitivity)
    });
  };

  let onMouseMove = (event) => {
    if (document.pointerLockElement === videoRef.value) {
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      sendEventData({
        type: 'mouse_move',
        x: movementX,
        y: movementY,
        absolute: false
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

  const toggleMouseLock = async () => {
    try {
      if (!isPointerLocked.value) {
        await videoRef.value.requestPointerLock();
        document.addEventListener('mousemove', onMouseMove, false);
      } else {
        document.exitPointerLock();
        document.removeEventListener('mousemove', onMouseMove, false);
      }
    } catch (error) {
      console.error('Pointer lock toggle failed:', error);
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
    } else {
      videoRef.value.onmouseup = null;
      videoRef.value.onmousedown = null;
      videoRef.value.onmousemove = null;
      videoRef.value.onwheel = null;
      document.oncontextmenu = null;
    }
  };

  const cleanup = () => {
    mouseEnabled.value = false;
    mouseTrackEnabled.value = false;
    isPointerLocked.value = false;
    document.oncontextmenu = null;
    updateMouseListeners();
    document.removeEventListener('mousemove', onMouseMove);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  };

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
