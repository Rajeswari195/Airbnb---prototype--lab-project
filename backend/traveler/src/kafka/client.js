// backend/traveler/src/kafka/client.js
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'traveler-service',
  brokers: (
    process.env.KAFKA_BROKERS ||
    process.env.KAFKA_BROKER || // fallback if single var is set
    'kafka.airbnb-lab2.svc.cluster.local:9092'
  ).split(','),
});

export default kafka;

