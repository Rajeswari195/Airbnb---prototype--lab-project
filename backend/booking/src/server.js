import { createApp } from './app.js';
const app = createApp();
import { startBookingConsumer } from './kafka/consumer.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 8003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/airbnb';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Booking service connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Booking API listening on :${PORT}`);
    });

    startBookingConsumer().catch(err => {
      console.error('Failed to start booking consumer:', err);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

start();
