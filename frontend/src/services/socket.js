/**
 * Socket.io client factory.
 *
 * Creates and returns a Socket.io client connected to the backend.
 * The JWT token is passed during the handshake for authentication.
 *
 * Usage:
 *   import { createSocket } from './services/socket';
 *   const socket = createSocket(token);
 */

import { io } from 'socket.io-client';

let socket = null;

/**
 * Create (or reuse) a Socket.io connection.
 * @param {string} token - JWT token for authentication
 * @returns {import('socket.io-client').Socket}
 */
export function createSocket(token) {
  if (socket && socket.connected) return socket;

  socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Socket.io] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.io] Disconnected:', reason);
  });

  socket.on('error', (err) => {
    console.error('[Socket.io] Error:', err.message);
  });

  return socket;
}

/**
 * Disconnect and clear the socket instance.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket };
