/**
 * Chat controller — HTTP handlers for /api/v1/chat routes.
 *
 * Validates: Requirements 10.1–10.5
 */

const chatService = require('../services/chatService');

/**
 * GET /api/v1/chat/:bookingId/history
 * Authenticated. Participants only. Returns messages ordered by created_at ASC.
 */
async function getChatHistory(req, res, next) {
  try {
    const messages = await chatService.getChatHistory(
      Number(req.params.bookingId),
      req.user.userId
    );
    return res.status(200).json({
      success: true,
      data: messages,
      message: 'Chat history retrieved successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getChatHistory };
