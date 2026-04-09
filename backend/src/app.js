/**
 * Express application factory.
 *
 * Creates and configures the Express app with:
 *  - CORS
 *  - JSON body parsing
 *  - Rate limiting
 *  - API routes (/api/v1/*)
 *  - Global error handler
 *
 * The app is exported separately from the HTTP server so it can be
 * imported cleanly in tests without starting a real server.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const rateLimiter = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

// ── Route imports (stubs — filled in by later tasks) ──────────────────────────
const authRoutes = require('./routes/auth');
const providerRoutes = require('./routes/providers');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static file serving (uploaded documents) ─────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Preflight handling ────────────────────────────────────────────────────────
app.options('/api/*', cors(corsOptions));

// ── Rate limiting (applied to all /api routes) ────────────────────────────────
app.use('/api', rateLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, data: null, message: 'TapTrust API is running.' });
});
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, data: null, message: 'TapTrust API is running.' });
});

// ── API v1 routes ─────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
