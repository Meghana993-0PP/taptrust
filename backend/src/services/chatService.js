/**
 * Chat_Service — business logic for real-time messaging.
 *
 * Validates: Requirements 10.1–10.5
 */

const { AppError } = require('../middleware/errorHandler');
const messageModel = require('../models/messageModel');
const bookingModel = require('../models/bookingModel');
const providerModel = require('../models/providerModel');

/**
 * Determine if a user (by userId) is a participant in a booking.
 * A participant is either the customer or the provider's user.
 *
 * @param {object} booking  - booking row (must include customer_id, provider_id)
 * @param {number} userId   - Users.id of the requesting user
 * @returns {Promise<boolean>}
 */
async function isParticipant(booking, userId) {
  if (booking.customer_id === userId) return true;

  // Resolve provider's user_id from Professionals.id
  const provider = await providerModel.findById(booking.provider_id);
  if (provider && provider.user_id === userId) return true;

  return false;
}

/**
 * Get chat history for a booking (authenticated participants only).
 * Returns messages ordered by created_at ASC.
 *
 * @param {number} bookingId
 * @param {number} userId  - req.user.userId
 * @returns {Promise<object[]>}
 */
async function getChatHistory(bookingId, userId) {
  const booking = await bookingModel.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  const participant = await isParticipant(booking, userId);
  if (!participant) {
    throw new AppError('Access denied. You are not a participant in this booking.', 403);
  }

  return messageModel.findByBookingId(bookingId);
}

/**
 * Persist a chat message and emit it to the booking room.
 * Called from the Socket.io chat:send handler.
 *
 * @param {{ bookingId: number, text: string, senderId: number, io: object }} params
 * @returns {Promise<object>} persisted message
 */
async function sendMessage({ bookingId, text, senderId, io }) {
  if (!bookingId || !text || !senderId) {
    throw new AppError('bookingId, text, and senderId are required.', 400);
  }

  const booking = await bookingModel.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  const participant = await isParticipant(booking, senderId);
  if (!participant) {
    throw new AppError('Access denied. You are not a participant in this booking.', 403);
  }

  // Determine receiver: the other participant
  const provider = await providerModel.findById(booking.provider_id);
  const receiverId =
    booking.customer_id === senderId
      ? (provider ? provider.user_id : null)
      : booking.customer_id;

  const messageId = await messageModel.createMessage({
    booking_id: bookingId,
    sender_id: senderId,
    receiver_id: receiverId,
    message_text: text,
  });

  const message = await messageModel.findById(messageId);

  // Emit to booking room
  if (io) {
    io.to(`booking:${bookingId}`).emit('chat:message', {
      senderId,
      text,
      timestamp: message.created_at,
    });
  }

  return message;
}

module.exports = { getChatHistory, sendMessage, isParticipant };
