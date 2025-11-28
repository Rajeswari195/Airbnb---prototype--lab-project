import { Kafka } from 'kafkajs';
import AnalyticsEvent from '../models/AnalyticsEvent.js';

const kafka = new Kafka({
    clientId: 'analytics-consumer',
    brokers: [(process.env.KAFKA_BROKER || 'kafka-service:9092')]
});

const consumer = kafka.consumer({ groupId: 'analytics-group' });

export async function startAnalyticsConsumer() {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: 'analytics.clicks', fromBeginning: true });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const payload = JSON.parse(message.value.toString());
                    console.log(`[Analytics] Received event: ${payload.eventType}`);

                    const event = new AnalyticsEvent({
                        traceId: payload.traceId,
                        userId: payload.userId,
                        eventType: payload.eventType,
                        payload: payload.payload,
                        timestamp: new Date()
                    });
                    await event.save();

                } catch (err) {
                    console.error('[Analytics] Error processing message:', err);
                }
            },
        });
        console.log('✅ Analytics Consumer started');
    } catch (err) {
        console.error('🔴 Analytics Consumer failed to start:', err);
    }
}
