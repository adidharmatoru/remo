import { ref } from 'vue';

export const keyboardControl = (eventChannel) => {
  const keyboardEnabled = ref(false);
  // Store the handler functions as persistent references
  const keydownHandler = handleKeyAction('key_down');
  const keyupHandler = handleKeyAction('key_up');

  function sendEventData(data) {
    if (eventChannel.value && eventChannel.value.readyState === 'open') {
      eventChannel.value.send(JSON.stringify(data));
    } else {
      console.warn('Event channel not ready');
    }
  }

  function handleKeyAction(action) {
    return (event) => {
      if (!keyboardEnabled.value) return;
      event.preventDefault();

      sendEventData({
        type: action,
        key: event.code
      });
    };
  }

  function toggleKeyboard() {
    keyboardEnabled.value = !keyboardEnabled.value;
    updateKeyboardListeners();
  }

  function updateKeyboardListeners() {
    if (keyboardEnabled.value) {
      document.addEventListener('keydown', keydownHandler);
      document.addEventListener('keyup', keyupHandler);
    } else {
      document.removeEventListener('keydown', keydownHandler);
      document.removeEventListener('keyup', keyupHandler);
    }
  }

  function cleanup() {
    keyboardEnabled.value = false;
    document.removeEventListener('keydown', keydownHandler);
    document.removeEventListener('keyup', keyupHandler);
  }

  return {
    keyboardEnabled,
    toggleKeyboard,
    cleanup
  };
};
