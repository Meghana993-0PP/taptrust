/**
 * Socket.io server configuration.
 *
 * Attaches a Socket.io instance to the provided HTTP server and configures:
 *  - CORS to allow the React frontend origin
 *  - JWT-based handshake authentication
 *  - User room joining (each user joins a room named `user:<userId>`)
 *  - Booking room joining for chat (room named `booking:<bookingId>`)
 *
 * Validates: Requirements 10.1, 10.3, 11.4
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

/**
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server} io
 */
function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Authentication middleware ──────────────────────────────────────────────
  // Validates the JWT token sent during the WebSocket handshake.
  // Disconnects the socket immediately if the token is invalid or missing.
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token is required.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attach decoded payload to socket
      return next();
    } catch {
      return next(new Error('Invalid or expired authentication token.'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId, role } = socket.user;
    console.log(`[Socket.io] User ${userId} (${role}) connected: ${socket.id}`);

    // Each user automatically joins their personal notification room
    socket.join(`user:${userId}`);

    // ── Booking room (chat) ──────────────────────────────────────────────────
    // Client emits 'join:booking' with { bookingId } to enter a chat room.
    socket.on('join:booking', ({ bookingId }) => {
      if (bookingId) {
        socket.join(`booking:${bookingId}`);
        console.log(`[Socket.io] User ${userId} joined booking room: ${bookingId}`);
      }
    });

    // ── Chat message handler ─────────────────────────────────────────────────
    // Event: chat:send  { bookingId, text }
    // Emits: chat:message { senderId, text, timestamp } → booking room
    socket.on('chat:send', async ({ bookingId, text }) => {
      try {
        const chatService = require('../services/chatService');
        await chatService.sendMessage({
          bookingId: Number(bookingId),
          text,
          senderId: userId,
          io,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket.io] User ${userId} disconnected: ${socket.id}`);
    });

    // ── Socket-level error handling ──────────────────────────────────────────
    socket.on('error', (err) => {
      console.error(`[Socket.io] Error for user ${userId}:`, err.message);
      socket.emit('error', { message: err.message });
    });
  });

  return io;
}

module.exports = { createSocketServer };
