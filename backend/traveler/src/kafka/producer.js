import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'traveler-service',
    brokers: [(process.env.KAFKA_BROKER || 'kafka-service:9092')]
});

const producer = kafka.producer();

export async function connectProducer() {
    try {
        await producer.connect();
        console.log('✅ Kafka Producer connected');
    } catch (err) {
        console.error('🔴 Kafka Producer connection error:', err);
    }
}

export async function sendBookingRequest(booking) {
    try {
        await producer.send({
            topic: 'booking.requests',
            messages: [
                {
                    key: String(booking._id),
                    value: JSON.stringify({
                        bookingId: booking._id,
                        propertyId: booking.propertyId,
                        userId: booking.userId,
                        endDate: booking.endDate,
                        guests: booking.guests,
                        traceId: booking.traceId || 'no-trace-id'
                    })
                }
            ]
        });
        console.log(`Sent booking.requests for ${booking._id}`);
    } catch (err) {
        console.error('Failed to send booking request:', err);
    }
}

export async function sendAnalyticsEvent(event) {
    try {
        await producer.send({
            topic: 'analytics.clicks',
            messages: [
                {
                    value: JSON.stringify({
                        traceId: event.traceId || 'no-trace-id',
                        userId: event.userId,
                        eventType: event.eventType,
                        payload: event.payload,
                        timestamp: new Date()
                    })
                }
            ]
        });
        // console.log(`Sent analytics event: ${event.eventType}`);
    } catch (err) {
        console.error('Failed to send analytics event:', err);
    }
}
