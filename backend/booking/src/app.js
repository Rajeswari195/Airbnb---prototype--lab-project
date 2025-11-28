import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import healthRoutes from './routes/health.js';
import bookingRoutes from './routes/booking.js';
import Booking from './models/Booking.js';

dotenv.config();

// Use env override if present, else default localhost Mongo
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airbnb';

export function createApp() {
  const app = express();

  // ---- Basic middleware ----
  app.use(cors({
    origin: (origin, cb) => cb(null, true), // Allow all for prototype
    credentials: true,
  }));
  app.use(express.json());

  // ---- Sessions (stored in MongoDB) ----
  app.use(
    session({
      name: 'sid', // Share cookie with traveler service
      secret: process.env.SESSION_SECRET || 'dev_fallback_secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: mongoUri,
        collectionName: 'sessions',
      }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  // ---- Root route (debug) ----
  app.get('/', (_req, res) => {
    res.json({
      service: 'booking',
      status: 'ok',
      time: new Date().toISOString(),
    });
  });

  // ---- Health endpoints ----
  app.use('/api/health', healthRoutes);

  // 2) /health → simple inline health check
  app.get('/health', (_req, res) => {
    res.json({
      service: 'booking',
      status: 'ok',
      time: new Date().toISOString(),
    });
  });

  // ---- Mount API routes ----
  app.use('/api/bookings', bookingRoutes);

  // ---- Minimal bookings listing (using Mongoose) ----
  app.get('/bookings', async (_req, res) => {
    try {
      const bookings = await Booking.find().limit(50);
      res.json(bookings);
    } catch (err) {
      console.error('[booking-service] DB error:', err.message);
      res.status(500).json({ error: 'DB error in booking service' });
    }
  });

  return app;
}
