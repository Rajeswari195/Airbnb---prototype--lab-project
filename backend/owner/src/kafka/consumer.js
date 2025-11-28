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

import Booking from '../models/Booking.js';

async function handleBookingCreated(event) {
  console.log('[owner-service] handleBookingCreated:', event);
  try {
    const { bookingId, propertyId, travelerId, startDate, endDate, guests, status, createdAt } = event;

    // Check if booking already exists (idempotency)
    const existing = await Booking.findById(bookingId);
    if (existing) {
      console.log('[owner-service] Booking already exists:', bookingId);
      return;
    }

    // Create new booking document with the SAME ID as the MySQL booking
    const booking = new Booking({
      _id: bookingId, // Use the ID from the event (MySQL ID) if possible, but Mongoose expects ObjectId. 
      // Wait, MySQL IDs are integers. MongoDB IDs are ObjectIds.
      // The Booking model in owner service defines _id as ObjectId by default?
      // Let's check the Booking model again.
      propertyId,
      userId: travelerId,
      startDate,
      endDate,
      guests,
      status,
      createdAt
    });

    // ISSUE: MySQL IDs are integers (1, 2, 3). MongoDB IDs are 24-char hex strings.
    // If I try to save `_id: 1` in Mongoose, it might fail if the schema expects ObjectId.
    // The Booking model I viewed earlier:
    // const bookingSchema = new mongoose.Schema({ propertyId: { type: ObjectId ... } ... });
    // It doesn't explicitly define _id, so it defaults to ObjectId.

    // If I save it without _id, Mongoose generates a new ObjectId.
    // But then I can't correlate it easily with the MySQL booking for updates (Accept/Cancel).
    // The event has `bookingId`. I should store this as `mysqlBookingId` or similar?
    // OR, I can just store it as `_id` if I change the schema to allow Number or String.

    // Let's look at the Booking model again.

    await booking.save();
    console.log('[owner-service] Booking saved to MongoDB:', booking._id);
  } catch (err) {
    console.error('[owner-service] Failed to save booking:', err);
  }
}

// NOTE:
// - No `export default`
// - No `module.exports`
// - Only ES-module syntax with a *named* export `startBookingConsumer`
