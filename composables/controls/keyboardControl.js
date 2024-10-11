import { ref } from 'vue';

export const keyboardControl = (eventChannel) => {
  const keyboardEnabled = ref(false);

  const sendEventData = (data) => {
    if (eventChannel.value && eventChannel.value.readyState === 'open') {
      eventChannel.value.send(JSON.stringify(data));
    } else {
      console.warn('Event channel not ready');
    }
  };

  const handleKeyAction = (action) => (event) => {
    if (!keyboardEnabled.value) return;
    event.preventDefault();

    sendEventData({
      type: action,
      key: event.code
    });
  };

  const toggleKeyboard = () => {
    keyboardEnabled.value = !keyboardEnabled.value;
    updateKeyboardListeners();
  };

  const updateKeyboardListeners = () => {
    if (keyboardEnabled.value) {
      document.addEventListener('keydown', handleKeyAction('key_down'));
      document.addEventListener('keyup', handleKeyAction('key_up'));
    } else {
      document.removeEventListener('keydown', handleKeyAction('key_down'));
      document.removeEventListener('keyup', handleKeyAction('key_up'));
    }
  };

  const cleanup = () => {
    keyboardEnabled.value = false;
    updateKeyboardListeners();
  };

  return {
    keyboardEnabled,
    toggleKeyboard,
    updateKeyboardListeners,
    cleanup
  };
};
