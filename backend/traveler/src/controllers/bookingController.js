import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import { sendBookingRequest } from '../kafka/producer.js';

export async function createBooking(req, res, next) {
  try {
    const travelerId = req.session.user.id;
    const { propertyId, start, end, guests } = req.body || {};
    if (!propertyId || !start || !end || !guests) {
      return res.status(400).json({ error: 'propertyId,start,end,guests required' });
    }

    // Use Mongoose to find property
    const prop = await Property.findById(propertyId);
    if (!prop) return res.status(404).json({ error: 'Property not found' });

    // Check capacity (assuming prop.capacity or prop.guests_max exists)
    const capacity = prop.capacity || prop.guests_max || 100;
    if (guests > capacity) return res.status(400).json({ error: 'Guests exceed capacity' });

    // Create Booking in MongoDB
    const booking = new Booking({
      propertyId,
      userId: travelerId,
      startDate: start,
      endDate: end,
      guests,
      status: 'PENDING'
    });
    await booking.save();

    // Publish to Kafka
    const bookingData = {
      _id: booking._id,
      propertyId,
      userId: travelerId,
      startDate: start,
      endDate: end,
      guests,
      status: 'PENDING'
    };

    // Fire and forget (or await if critical)
    sendBookingRequest(bookingData).catch(err => console.error("Kafka Publish Error:", err));

    res.status(201).json({ id: booking._id, status: 'PENDING' });
  } catch (err) { next(err); }
}

export async function listTravelerBookings(req, res, next) {
  try {
    const travelerId = req.session.user.id;
    const status = req.query.status;

    const query = { userId: travelerId };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('propertyId', 'title city country price') // Populate property details
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) { next(err); }
}
