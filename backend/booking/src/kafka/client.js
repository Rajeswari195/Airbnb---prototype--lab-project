import { Kafka } from 'kafkajs';

const broker =
  process.env.KAFKA_BROKER ||
  process.env.KAFKA_BROKERS ||
  'kafka:9092';

console.log('[booking-service] Using Kafka broker:', broker);

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: [broker],
});

export default kafka;


