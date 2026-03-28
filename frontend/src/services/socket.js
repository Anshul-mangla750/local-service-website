import { io } from "socket.io-client";

let socketClient = null;

function getSocketBaseUrl() {
  const rawBaseUrl = import.meta.env.VITE_API_BASE || "";

  if (!rawBaseUrl) {
    return undefined;
  }

  return rawBaseUrl.replace(/\/api\/?$/, "");
}

export function connectSocket() {
  if (!socketClient) {
    socketClient = io(getSocketBaseUrl(), {
      autoConnect: true,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  } else if (!socketClient.connected) {
    socketClient.connect();
  }

  return socketClient;
}

export function getSocket() {
  return socketClient;
}

export function disconnectSocket() {
  if (!socketClient) {
    return;
  }

  socketClient.disconnect();
  socketClient = null;
}
