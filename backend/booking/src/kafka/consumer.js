import { Kafka } from 'kafkajs';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

const kafka = new Kafka({
    clientId: 'booking-service',
    brokers: [(process.env.KAFKA_BROKER || 'kafka-service:9092')]
});

const consumer = kafka.consumer({ groupId: 'booking-group' });
const producer = kafka.producer();

export async function startBookingConsumer() {
    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topic: 'booking.requests', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const prefix = `[BookingConsumer] ${topic}[${partition}|${message.offset}] / ${message.timestamp}`;
            console.log(`- ${prefix} ${message.key}#${message.value}`);

            try {
                const payload = JSON.parse(message.value.toString());
                const { bookingId, propertyId, startDate, endDate } = payload;

                console.log(`Processing booking ${bookingId} for property ${propertyId}`);

                // 1. Check availability again (double check)
                const overlap = await Booking.findOne({
                    propertyId: propertyId,
                    _id: { $ne: bookingId }, // exclude self
                    status: { $in: ['Pending', 'Accepted'] },
                    startDate: { $lte: new Date(endDate) },
                    endDate: { $gte: new Date(startDate) }
                });

                if (overlap) {
                    console.log(`Booking ${bookingId} rejected due to overlap`);
                    await Booking.findByIdAndUpdate(bookingId, { status: 'Cancelled' });
                    // Publish status update
                    await producer.send({
                        topic: 'booking.status',
                        messages: [{ key: String(bookingId), value: JSON.stringify({ bookingId, status: 'Cancelled', reason: 'Overlap' }) }]
                    });
                    return;
                }

                // 2. Auto-accept logic? Or just leave as Pending?
                // For now, leave as Pending (waiting for Owner to accept).
                // Or if we want to simulate "instant book", we could Accept.
                // Let's just log it and maybe emit a "Processed" event.

                console.log(`Booking ${bookingId} validated. Status: Pending`);

                // Emitting status just to confirm it was processed
                await producer.send({
                    topic: 'booking.status',
                    messages: [{ key: String(bookingId), value: JSON.stringify({ bookingId, status: 'Pending', reason: 'Validated' }) }]
                });

            } catch (err) {
                console.error(`${prefix} Error processing message:`, err);
            }
        },
    });
}
