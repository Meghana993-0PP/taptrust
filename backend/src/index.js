/**
 * TapTrust Backend — Entry Point
 *
 * Starts the HTTP server, attaches Socket.io, and connects to MySQL.
 */

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { testConnection } = require('./config/db');
const { createSocketServer } = require('./config/socket');

const PORT = parseInt(process.env.PORT || '5000', 10);

// Create the HTTP server from the Express app
const httpServer = http.createServer(app);

// Attach Socket.io to the HTTP server
const io = createSocketServer(httpServer);

// Make the io instance available to route handlers via app.locals
app.locals.io = io;

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Verify database connectivity before accepting traffic
    await testConnection();

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] TapTrust API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
      console.log(`[Server] Socket.io attached`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

start();

module.exports = { httpServer, io };

