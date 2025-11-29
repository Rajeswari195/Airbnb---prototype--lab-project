import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'owner-service',
  brokers: (process.env.KAFKA_BROKERS || 'kafka-service:9092').split(','),
});

export default kafka;