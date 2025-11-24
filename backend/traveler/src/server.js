// backend/traveler/src/server.js
import app from './app.js';
import { startStatusConsumer } from './kafka/statusConsumer.js';
import { connectMongoTraveler } from './config/mongo.js';

const port = Number(process.env.PORT || 8000);

// Optional: enable Kafka only if needed
const enableKafka = process.env.ENABLE_KAFKA === 'true';

async function startServer() {
  try {
    // 1. Connect to Mongo first
    await connectMongoTraveler();

    // 2. Start Express
    app.listen(port, () => {
      console.log(`Traveler API listening on :${port}`);

      // 3. Start Kafka if enabled
      if (enableKafka) {
        console.log('[traveler-service] Kafka consumer enabled, starting...');
        startStatusConsumer().catch((err) => {
          console.error(
            '[traveler-service] Kafka status consumer failed to start:',
            err
          );
        });
      } else {
        console.log(
          '[traveler-service] Kafka consumer disabled (set ENABLE_KAFKA=true to enable)'
        );
      }
    });
  } catch (err) {
    console.error('[Traveler] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
