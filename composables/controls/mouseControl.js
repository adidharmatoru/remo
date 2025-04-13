import { ref } from 'vue';

export const mouseControl = (videoRef, eventChannel) => {
  const mouseEnabled = ref(false);
  const mouseTrackEnabled = ref(false);
  const isPointerLocked = ref(false);

  const ButtonName = ['left', 'middle', 'right'];

  // Add touch handling variables
  const lastTouchX = ref(0);
  const lastTouchY = ref(0);
  const hasMoved = ref(false);
  const touchStartTime = ref(0);
  const touchCount = ref(0);
  const touchEndTime = ref(0);
  const TAP_THRESHOLD = 300; // Maximum time in ms for a tap
  const MOVE_THRESHOLD = 10; // Minimum movement in pixels to consider it a move

  // Add keyboard state tracking
  const keyboardVisible = ref(false);
  const keyboardInput = ref(null);

  // Add two-finger scroll tracking
  const isTwoFingerTouch = ref(false);
  const lastTwoFingerY = ref(0);
  const scrollSensitivity = 10; // Adjust this value to control scroll speed

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

  // Prevent scrolling on the video element
  const preventScroll = (event) => {
    event.preventDefault();
  };

  const onTouchStart = (event) => {
    if (!mouseEnabled.value) return;
    event.preventDefault();

    touchStartTime.value = Date.now();
    touchCount.value = event.touches.length;
    hasMoved.value = false;
    isTwoFingerTouch.value = false;

    if (event.touches.length === 2) {
      // Initialize two-finger scroll
      lastTwoFingerY.value =
        (event.touches[0].clientY + event.touches[1].clientY) / 2;
    } else {
      // Single finger touch handling
      const touch = event.touches[0];
      lastTouchX.value = touch.clientX;
      lastTouchY.value = touch.clientY;
    }
  };

  const onTouchMove = (event) => {
    if (!mouseEnabled.value) return;
    event.preventDefault();

    if (event.touches.length === 2) {
      // Handle two-finger scroll
      isTwoFingerTouch.value = true;
      const currentY =
        (event.touches[0].clientY + event.touches[1].clientY) / 2;
      const deltaY = currentY - lastTwoFingerY.value;
      lastTwoFingerY.value = currentY;

      // Convert movement to scroll events
      sendEventData({
        type: 'mouse_wheel',
        x: 0,
        y: -Math.round(deltaY / scrollSensitivity) // Negative to match natural scrolling
      });
    } else if (event.touches.length === 1) {
      // Single finger movement for cursor dragging
      const touch = event.touches[0];
      const movementX = touch.clientX - lastTouchX.value;
      const movementY = touch.clientY - lastTouchY.value;

      // Update last position
      lastTouchX.value = touch.clientX;
      lastTouchY.value = touch.clientY;

      // Check if movement exceeds threshold
      if (
        Math.abs(movementX) > MOVE_THRESHOLD ||
        Math.abs(movementY) > MOVE_THRESHOLD
      ) {
        hasMoved.value = true;
      }

      // Always send movement events for cursor dragging
      sendEventData({
        type: 'mouse_move',
        x: movementX,
        y: movementY,
        absolute: false
      });
    }
  };

  const onTouchEnd = (event) => {
    if (!mouseEnabled.value) return;
    event.preventDefault();

    touchEndTime.value = Date.now();
    const tapDuration = touchEndTime.value - touchStartTime.value;
    const isQuickTap = tapDuration < TAP_THRESHOLD;
    const totalFingers = touchCount.value;

    // Only process as clicks if there was no movement and it was a quick tap
    if (!isQuickTap || hasMoved.value || isTwoFingerTouch.value) {
      isTwoFingerTouch.value = false;
      return;
    }

    const touch = event.changedTouches[0];

    switch (totalFingers) {
      case 1: // Single finger tap - left click
        sendEventData({
          type: 'mouse_down',
          ...toCoordinate(touch),
          absolute: true,
          button: 'left'
        });
        setTimeout(() => {
          sendEventData({
            type: 'mouse_up',
            ...toCoordinate(touch),
            absolute: true,
            button: 'left'
          });
        }, 50);
        break;
      case 2: // Two finger tap - right click
        sendEventData({
          type: 'mouse_down',
          ...toCoordinate(touch),
          absolute: true,
          button: 'right'
        });
        setTimeout(() => {
          sendEventData({
            type: 'mouse_up',
            ...toCoordinate(touch),
            absolute: true,
            button: 'right'
          });
        }, 50);
        break;
      case 3: // Three finger tap - toggle keyboard
        if (typeof window !== 'undefined') {
          if (!keyboardVisible.value) {
            // Show keyboard
            const temp = document.createElement('input');
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            temp.style.top = '0';
            temp.style.left = '0';
            temp.style.width = '1px';
            temp.style.height = '1px';

            document.body.appendChild(temp);
            temp.focus();

            keyboardInput.value = temp;
            keyboardVisible.value = true;
          } else {
            // Hide keyboard
            if (
              keyboardInput.value &&
              document.body.contains(keyboardInput.value)
            ) {
              document.body.removeChild(keyboardInput.value);
            }
            keyboardInput.value = null;
            keyboardVisible.value = false;
          }
        }
        break;
    }
  };

  const updateMouseListeners = () => {
    if (!videoRef.value) return;

    if (mouseEnabled.value) {
      // Mouse events using on[event] properties
      videoRef.value.onmouseup = onVideoMouse('mouse_up');
      videoRef.value.onmousedown = onVideoMouse('mouse_down');
      videoRef.value.onmousemove = onVideoMouse('mouse_move');
      videoRef.value.onwheel = onVideoWheel;

      // Touch events using on[event] properties
      videoRef.value.ontouchend = (e) => {
        preventScroll(e);
        onTouchEnd(e);
      };
      videoRef.value.ontouchmove = (e) => {
        preventScroll(e);
        onTouchMove(e);
      };
      videoRef.value.ontouchstart = (e) => {
        preventScroll(e);
        onTouchStart(e);
      };

      document.oncontextmenu = () => false;
    } else {
      // Remove all listeners
      videoRef.value.onmouseup = null;
      videoRef.value.onmousedown = null;
      videoRef.value.onmousemove = null;
      videoRef.value.onwheel = null;
      videoRef.value.ontouchend = null;
      videoRef.value.ontouchmove = null;
      videoRef.value.ontouchstart = null;
      document.oncontextmenu = null;
    }
  };

  const cleanup = () => {
    mouseEnabled.value = false;
    mouseTrackEnabled.value = false;
    isPointerLocked.value = false;
    document.oncontextmenu = null;

    if (videoRef.value) {
      videoRef.value.onmouseup = null;
      videoRef.value.onmousedown = null;
      videoRef.value.onmousemove = null;
      videoRef.value.onwheel = null;
      videoRef.value.ontouchend = null;
      videoRef.value.ontouchmove = null;
      videoRef.value.ontouchstart = null;
    }

    document.removeEventListener('mousemove', onMouseMove);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    // Add keyboard cleanup
    if (keyboardInput.value && document.body.contains(keyboardInput.value)) {
      document.body.removeChild(keyboardInput.value);
    }
    keyboardInput.value = null;
    keyboardVisible.value = false;
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
    cleanup,
    keyboardVisible
  };
};
