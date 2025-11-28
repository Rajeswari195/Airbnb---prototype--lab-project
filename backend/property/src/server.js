import { createApp, connectMongoProperty } from './app.js';

const PORT = process.env.PORT || 8002;

async function start() {
  await connectMongoProperty();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Property service listening on :${PORT}`);
  });
}

start();
