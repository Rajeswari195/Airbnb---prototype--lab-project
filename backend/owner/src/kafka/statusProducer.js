// backend/owner/src/kafka/statusProducer.js
import kafka from './client.js';

let statusProducer;

/**
 * Lazily create and reuse a Kafka producer for booking-status events.
 */
async function getStatusProducer() {
  if (!statusProducer) {
    statusProducer = kafka.producer();
    await statusProducer.connect();
    console.log('[owner-service] Kafka status producer connected');
  }
  return statusProducer;
}

/**
 * Publish BOOKING_STATUS_UPDATED events so Traveler/other services
 * can consume them.
 */
export async function sendStatusEvent(event) {
  const producer = await getStatusProducer();
  const topic = process.env.BOOKING_STATUS_TOPIC || 'booking-status-events';

  await producer.send({
    topic,
    messages: [
      {
        key: String(event.bookingId ?? ''),
        value: JSON.stringify(event),
      },
    ],
  });

  console.log('[owner-service] Sent booking status event:', event);
}
