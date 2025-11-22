import { createApp } from './app.js';

const PORT = process.env.PORT || 8002;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Property service listening on :${PORT}`);
});
