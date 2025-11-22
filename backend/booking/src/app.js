// backend/booking/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import healthRoutes from './routes/health.js';

dotenv.config();

export function createApp() {
  const app = express();

  // ---- Basic middleware ----
  app.use(cors());
  app.use(express.json());

  // ---- Root route (debug) ----
  app.get('/', (_req, res) => {
    res.json({
      service: 'booking',
      status: 'ok',
      time: new Date().toISOString(),
    });
  });

  // ---- Health endpoints ----

  // 1) /api/health → uses your health router
  //    backend/booking/src/routes/health.js
  //    returns: { status: 'ok', service: 'Booking API', time: ... }
  app.use('/api/health', healthRoutes);

  // 2) /health → simple inline health check
  app.get('/health', (_req, res) => {
    res.json({
      service: 'booking',
      status: 'ok',
      time: new Date().toISOString(),
    });
  });

  // ---- DB config for /bookings ----
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'airbnb_user',
    password: process.env.DB_PASSWORD || 'YourStrong#Pass123',
    database: process.env.DB_NAME || 'airbnb_app',
  };

  // ---- Minimal bookings listing (for CLI checks) ----
  app.get('/bookings', async (_req, res) => {
    try {
      const conn = await mysql.createConnection(dbConfig);
      const [rows] = await conn.execute('SELECT * FROM bookings LIMIT 50');
      await conn.end();
      res.json(rows);
    } catch (err) {
      console.error('[booking-service] DB error:', err.message);
      res.status(500).json({ error: 'DB error in booking service' });
    }
  });

  return app;
}
