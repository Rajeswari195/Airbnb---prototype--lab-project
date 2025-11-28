import { Router } from 'express';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import requireAuth from '../middleware/auth.js';
import Joi from 'joi';
import { sendBookingEvent } from '../kafka/producer.js';

const router = Router();

const createSchema = Joi.object({
  propertyId: Joi.string().required(), // ObjectId is string
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  guests: Joi.number().integer().min(1).required(),
});

const updateSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  guests: Joi.number().integer().min(1),
}).min(1);

// Create booking – PRODUCER: BOOKING_CREATED
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = await createSchema.validateAsync(req.body, { abortEarly: false });
    const { propertyId, startDate, endDate, guests } = payload;

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'endDate must be after startDate' });
    }

    const prop = await Property.findById(propertyId);
    if (!prop) return res.status(404).json({ error: 'Property not found' });
    if (guests > prop.capacity) {
      return res.status(400).json({ error: 'Guests exceed capacity' });
    }

    // Check overlap
    const overlap = await Booking.findOne({
      propertyId,
      status: { $in: ['Pending', 'Accepted'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });

    if (overlap) {
      return res.status(409).json({ error: 'Property not available for those dates' });
    }

    const booking = new Booking({
      userId: req.session.userId,
      propertyId,
      startDate,
      endDate,
      guests,
      status: 'Pending',
      totalPrice: prop.price * ((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    });
    await booking.save();

    const responseBody = { id: booking._id, status: 'Pending' };
    res.status(201).json(responseBody);

    // ---- ASYNC: publish Kafka event (does not block response) ----
    const event = {
      type: 'BOOKING_CREATED',
      bookingId: booking._id, // ObjectId
      propertyId,
      travelerId: req.session.userId,
      status: 'Pending',
      startDate,
      endDate,
      guests,
      createdAt: booking.createdAt.toISOString(),
    };

    sendBookingEvent(event).catch((err) => {
      console.error('[booking-service] Failed to send booking event:', err);
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ error: 'Validation failed', details: err.details });
    }
    next(err);
  }
});

// List bookings for logged-in traveler
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, scope } = req.query;
    const query = { userId: req.session.userId };

    if (status) query.status = status;
    if (scope === 'past') query.endDate = { $lt: new Date() };

    const bookings = await Booking.find(query)
      .populate('propertyId', 'title city price')
      .sort({ startDate: -1 });

    const rows = bookings.map(b => ({
      id: b._id,
      propertyId: b.propertyId?._id,
      startDate: b.startDate,
      endDate: b.endDate,
      guests: b.guests,
      status: b.status,
      title: b.propertyId?.title,
      city: b.propertyId?.city,
      price: b.propertyId?.price
    }));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Modify a booking (Accepted → Pending again)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = await updateSchema.validateAsync(req.body, { abortEarly: false });

    const booking = await Booking.findOne({ _id: id, userId: req.session.userId }).populate('propertyId');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cancelled bookings cannot be modified' });
    }

    const newStart = payload.startDate ? new Date(payload.startDate) : booking.startDate;
    const newEnd = payload.endDate ? new Date(payload.endDate) : booking.endDate;
    const newGuests = payload.guests != null ? payload.guests : booking.guests;

    if (newEnd < newStart) {
      return res.status(400).json({ error: 'endDate must be after startDate' });
    }
    if (booking.propertyId && newGuests > booking.propertyId.capacity) {
      return res.status(400).json({ error: 'Guests exceed capacity' });
    }

    // Check overlap excluding current booking
    const overlap = await Booking.findOne({
      propertyId: booking.propertyId._id,
      _id: { $ne: id },
      status: { $in: ['Pending', 'Accepted'] },
      $or: [
        { startDate: { $lte: newEnd }, endDate: { $gte: newStart } }
      ]
    });

    if (overlap) {
      return res.status(409).json({ error: 'Property not available for those dates' });
    }

    booking.startDate = newStart;
    booking.endDate = newEnd;
    booking.guests = newGuests;
    if (booking.status === 'Accepted') booking.status = 'Pending';

    // Recalculate price if dates changed
    if (payload.startDate || payload.endDate) {
      booking.totalPrice = booking.propertyId.price * ((newEnd - newStart) / (1000 * 60 * 60 * 24));
    }

    await booking.save();

    res.json({
      id: booking._id,
      status: booking.status,
      startDate: booking.startDate,
      endDate: booking.endDate,
      guests: booking.guests,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ error: 'Validation failed', details: err.details });
    }
    next(err);
  }
});

// Cancel a booking
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({ _id: id, userId: req.session.userId });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'Cancelled') {
      return res.json({ id: booking._id, status: 'Cancelled' });
    }
    if (booking.status !== 'Pending') {
      return res.status(400).json({ error: 'Only Pending bookings can be cancelled' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.json({ id: booking._id, status: 'Cancelled' });
  } catch (err) {
    next(err);
  }
});

export default router;
