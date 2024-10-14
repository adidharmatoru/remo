import { ref, onMounted, onUnmounted } from 'vue';

let globalWebSocket = null;

export function webSocket(isGlobal = true) {
  const websocket = ref(null);
  const isOnline = ref(websocket.value ? true : false);
  const reconnectInterval = ref(null);
  const keepAliveInterval = ref(null);

  const connect = () => {
    if (globalWebSocket) {
      websocket.value = globalWebSocket;
      isOnline.value = globalWebSocket.readyState === WebSocket.OPEN;
      return;
    }

    const websocketUrl = 'wss://remote-ws.adidharmatoru.dev';
    websocket.value = new WebSocket(websocketUrl);

    websocket.value.onopen = () => {
      //   console.log('WebSocket connected');
      isOnline.value = true;
      clearInterval(reconnectInterval.value);
      reconnectInterval.value = null;
      startKeepAlive();
    };

    websocket.value.onclose = () => {
      //   console.log('WebSocket disconnected');
      isOnline.value = false;
      clearInterval(keepAliveInterval.value);
      keepAliveInterval.value = null;
      reconnect();
    };

    websocket.value.onerror = (error) => {
      console.error('WebSocket error:', error);
      isOnline.value = false;
    };

    websocket.value.onmessage = (event) => {
      const signal = JSON.parse(event.data);
      // Handle incoming messages here
      console.log('Received message:', signal);
    };

    if (isGlobal) {
      globalWebSocket = websocket.value;
    }
  };

  const reconnect = () => {
    if (!reconnectInterval.value) {
      reconnectInterval.value = setInterval(() => {
        if (!isOnline.value) {
          connect();
        }
      }, 5000); // Try to reconnect every 5 seconds
    }
  };

  const startKeepAlive = () => {
    keepAliveInterval.value = setInterval(() => {
      sendMessage({ type: 'keep_alive' });
    }, 30000); // Send keep-alive every 30 seconds
  };

  const sendMessage = (message) => {
    if (websocket.value && websocket.value.readyState === WebSocket.OPEN) {
      websocket.value.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent.');
    }
  };

  const sendMessageOnConnection = async (message) => {
    if (!isOnline.value) {
      await waitForConnection();
    }
    return sendMessage(message);
  };

  const waitForConnection = () => {
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (isOnline.value) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    if (isGlobal && websocket.value) {
      websocket.value.close();
    }
    if (reconnectInterval.value) {
      clearInterval(reconnectInterval.value);
    }
    if (keepAliveInterval.value) {
      clearInterval(keepAliveInterval.value);
    }
  });

  return {
    isOnline,
    sendMessage,
    sendMessageOnConnection,
    websocket,
    waitForConnection
  };
}
