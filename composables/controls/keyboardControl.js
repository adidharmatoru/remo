import { ref } from 'vue';
import { sendEventData } from './binarySerializer';

export const keyboardControl = (eventChannel) => {
  const keyboardEnabled = ref(false);
  // Store the handler functions as persistent references
  const keydownHandler = handleKeyAction('key_down');
  const keyupHandler = handleKeyAction('key_up');

  function handleKeyAction(action) {
    return (event) => {
      if (!keyboardEnabled.value) return;
      event.preventDefault();

      sendEventData(eventChannel.value, {
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
    // First disable keyboard to prevent new events
    keyboardEnabled.value = false;

    // Remove event listeners
    document.removeEventListener('keydown', keydownHandler);
    document.removeEventListener('keyup', keyupHandler);

    // Create temporary handlers to remove any lingering preventDefault
    const tempKeydownHandler = (event) => {
      event.stopPropagation();
    };
    const tempKeyupHandler = (event) => {
      event.stopPropagation();
    };

    // Add and immediately remove them to clear any lingering event prevention
    document.addEventListener('keydown', tempKeydownHandler);
    document.addEventListener('keyup', tempKeyupHandler);
    document.removeEventListener('keydown', tempKeydownHandler);
    document.removeEventListener('keyup', tempKeyupHandler);
  }

  return {
    keyboardEnabled,
    toggleKeyboard,
    cleanup
  };
};
