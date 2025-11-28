import { Router } from 'express';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import requireAuth from '../middleware/auth.js';
import { sendBookingRequest } from '../kafka/producer.js';
import Joi from 'joi';

const router = Router();

const createSchema = Joi.object({
  propertyId: Joi.string().required(), // ObjectId as string
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  guests: Joi.number().integer().min(1).required(),
});

const updateSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  guests: Joi.number().integer().min(1),
}).min(1);

// Create booking
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
      propertyId: propertyId,
      status: { $in: ['Pending', 'Accepted'] },
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    });

    if (overlap) {
      return res.status(409).json({ error: 'Property not available for those dates' });
    }

    // Create Booking in Pending state
    const booking = new Booking({
      userId: req.session.mongoUserId,
      propertyId: propertyId,
      startDate: startDate,
      endDate: endDate,
      guests: guests,
      status: 'Pending',
      totalPrice: prop.price * ((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    });
    await booking.save();

    // Publish to Kafka
    await sendBookingRequest(booking);

    res.status(201).json({ id: booking._id, status: 'Pending' });
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
    const query = { userId: req.session.mongoUserId };

    if (status) {
      query.status = status;
    }
    if (scope === 'past') {
      query.endDate = { $lt: new Date() };
    }

    const bookings = await Booking.find(query)
      .populate('propertyId', 'title city price')
      .sort({ startDate: -1 });

    // Normalize for frontend
    const rows = bookings.map(b => ({
      id: b._id,
      propertyId: b.propertyId._id,
      startDate: b.startDate,
      endDate: b.endDate,
      guests: b.guests,
      status: b.status,
      title: b.propertyId.title,
      city: b.propertyId.city,
      price: b.propertyId.price
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

    const booking = await Booking.findById(id).populate('propertyId');

    if (!booking || booking.userId.toString() !== req.session.mongoUserId) {
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
    if (newGuests > booking.propertyId.capacity) {
      return res.status(400).json({ error: 'Guests exceed capacity' });
    }

    // Check overlap (excluding self)
    const overlap = await Booking.findOne({
      propertyId: booking.propertyId._id,
      _id: { $ne: id },
      status: { $in: ['Pending', 'Accepted'] },
      startDate: { $lte: newEnd },
      endDate: { $gte: newStart }
    });

    if (overlap) {
      return res.status(409).json({ error: 'Property not available for those dates' });
    }

    const newStatus = booking.status === 'Accepted' ? 'Pending' : booking.status;

    booking.startDate = newStart;
    booking.endDate = newEnd;
    booking.guests = newGuests;
    booking.status = newStatus;
    await booking.save();

    // If status changed to Pending, maybe re-send to Kafka? 
    // For now, let's assume modification just updates DB. 
    // Ideally, we should trigger a re-evaluation.
    if (newStatus === 'Pending') {
      await sendBookingRequest(booking);
    }

    res.json({
      id: booking._id,
      status: newStatus,
      startDate: newStart,
      endDate: newEnd,
      guests: newGuests,
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

    const booking = await Booking.findById(id);
    if (!booking || booking.userId.toString() !== req.session.mongoUserId) {
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
