// backend/traveler/src/server.js
import app from './app.js';
import { startStatusConsumer } from './kafka/statusConsumer.js';

const port = Number(process.env.PORT || 8000);

app.listen(port, () => {
  console.log(`Traveler API listening on :${port}`);

  // Start Kafka status consumer in the background
  startStatusConsumer().catch((err) => {
    console.error(
      '[traveler-service] Kafka status consumer failed to start:',
      err
    );
  });
});
