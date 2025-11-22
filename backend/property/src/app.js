import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'airbnb_user',
    password: process.env.DB_PASSWORD || 'YourStrong#Pass123',
    database: process.env.DB_NAME || 'airbnb_app',
  };

  // Simple health endpoint
  app.get('/health', (req, res) => {
    res.json({
      service: 'property',
      status: 'ok',
      time: new Date().toISOString(),
    });
  });

  // Minimal example: list properties (will hit your MySQL "properties" table)
  app.get('/properties', async (req, res) => {
    try {
      const conn = await mysql.createConnection(dbConfig);
      const [rows] = await conn.execute('SELECT * FROM properties LIMIT 50');
      await conn.end();
      res.json(rows);
    } catch (err) {
      console.error('[Property] DB error:', err.message);
      res.status(500).json({ error: 'DB error in property service' });
    }
  });

  return app;
}
