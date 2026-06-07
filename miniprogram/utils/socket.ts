// ─── WebSocket Client (Socket.IO compatible) ──

import { io, Socket } from 'socket.io-client';

// Use current host for WebSocket (Vite proxy handles /ws)
const SOCKET_URL = window.location.origin;

let socket: Socket | null = null;

export function useSocket() {
  function connect(token: string) {
    if (socket?.connected) return;

    socket = io(SOCKET_URL, {
      path: '/ws',
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socket.on('connect', () => {
      console.log('[WS] Connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
    });

    socket.on('error', (err) => {
      console.error('[WS] Error:', err);
    });

    // Re-join active rooms after reconnect
    socket.on('reconnect', () => {
      // Rooms are re-joined by chat page logic
    });
  }

  function disconnect() {
    socket?.disconnect();
    socket = null;
  }

  function getSocket(): Socket | null {
    return socket;
  }

  return { connect, disconnect, getSocket };
}
