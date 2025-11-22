import app from './app.js';
import { connectMongoOwner, mongoUri } from './config/mongo.js';
import { startBookingConsumer } from './kafka/consumer.js';

const PORT = process.env.PORT || 8001;

async function start() {
  await connectMongoOwner();

  app.listen(PORT, () => {
    console.log(`Owner API listening on :${PORT}`);
  });

  // Start Kafka consumer in background
  startBookingConsumer().catch((err) => {
    console.error('[Owner] Failed to start Kafka consumer:', err);
  });
}

start().catch((err) => {
  console.error('[Owner] Fatal startup error:', err);
  process.exit(1);
});
