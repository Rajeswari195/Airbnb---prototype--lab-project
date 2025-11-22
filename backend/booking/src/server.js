import { createApp } from './app.js';

const PORT = process.env.PORT || 8003;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Booking service listening on :${PORT}`);
});
