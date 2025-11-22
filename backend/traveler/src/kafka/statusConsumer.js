import kafka from './client.js';

const topic = process.env.BOOKING_STATUS_TOPIC || 'booking-status-events';

export async function startStatusConsumer() {
  const consumer = kafka.consumer({
    groupId: process.env.KAFKA_STATUS_GROUP_ID || 'traveler-status-group',
  });

  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  console.log(
    `[traveler-service] Kafka status consumer subscribed to topic "${topic}"`
  );

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value?.toString() || '{}';
        const event = JSON.parse(value);

        console.log('[traveler-service] received booking status event:', {
          topic,
          partition,
          offset: message.offset,
          event,
        });
      } catch (err) {
        console.error(
          '[traveler-service] Failed to process booking status event:',
          err
        );
      }
    },
  });
}
