import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Property from './models/Property.js';

dotenv.config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/airbnb';

export async function connectMongoProperty() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Property service connected to MongoDB');
  } catch (err) {
    console.error('🔴 Property service Mongo error:', err);
    process.exit(1);
  }
}

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Simple health endpoint
  app.get('/health', (req, res) => {
    res.json({
      service: 'property',
      status: 'ok',
      time: new Date().toISOString(),
    });
  });

  // List properties (using Mongoose)
  app.get('/properties', async (req, res) => {
    try {
      const properties = await Property.find().limit(50).sort({ _id: -1 });
      res.json(properties);
    } catch (err) {
      console.error('[Property] DB error:', err.message);
      res.status(500).json({ error: 'DB error in property service' });
    }
  });

  return app;
}
