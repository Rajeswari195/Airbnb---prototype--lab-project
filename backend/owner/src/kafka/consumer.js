// backend/owner/src/kafka/consumer.js
import kafka from './client.js';

let started = false;

// This is the named export that server.js imports
export async function startBookingConsumer() {
  if (started) return;
  started = true;

  const consumer = kafka.consumer({
    groupId: process.env.BOOKING_CONSUMER_GROUP || 'owner-service-group',
  });

  await consumer.connect();
  console.log('[owner-service] Kafka consumer connected');

  await consumer.subscribe({
    topic: process.env.BOOKING_TOPIC || 'booking-events',
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const raw = message.value.toString();
        const event = JSON.parse(raw);
        console.log('[owner-service] Received booking event:', event);

        if (event.type === 'BOOKING_CREATED') {
          await handleBookingCreated(event);
        }
      } catch (err) {
        console.error('[owner-service] Error processing booking event:', err);
      }
    },
  });
}

async function handleBookingCreated(event) {
  // For now just log – later you can update DB / notifications, etc.
  console.log('[owner-service] handleBookingCreated:', event);
}

// NOTE:
// - No `export default`
// - No `module.exports`
// - Only ES-module syntax with a *named* export `startBookingConsumer`
