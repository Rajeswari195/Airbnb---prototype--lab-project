// backend/booking/src/kafka/producer.js
import kafka from './client.js';

let producer;

async function getProducer() {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
    console.log('[booking-service] Kafka producer connected');
  }
  return producer;
}

export async function sendBookingEvent(event) {
  const prod = await getProducer();

  await prod.send({
    topic: process.env.BOOKING_TOPIC || 'booking-events',
    messages: [
      {
        key: String(event.bookingId),
        value: JSON.stringify(event),
      },
    ],
  });

  console.log('[booking-service] Sent booking event:', event);
}
