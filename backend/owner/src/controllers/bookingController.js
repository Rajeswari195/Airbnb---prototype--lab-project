import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import { sendStatusUpdate } from '../kafka/statusProducer.js';

export async function listIncoming(req, res, next) {
  try {
    const ownerId = req.session.user.id;
    const status = req.query.status || 'PENDING';

    // Find properties owned by this user
    const properties = await Property.find({ ownerId });
    const propertyIds = properties.map(p => p._id);

    // Find bookings for these properties
    const bookings = await Booking.find({
      propertyId: { $in: propertyIds },
      status: status
    })
      .populate('propertyId', 'title city country')
      .populate('userId', 'name email') // Populate traveler details
      .sort({ createdAt: -1 });

    // Map to match expected frontend format
    const rows = bookings.map(b => ({
      ...b.toObject(),
      title: b.propertyId?.title,
      city: b.propertyId?.city,
      country: b.propertyId?.country,
      traveler_name: b.userId?.name,
      traveler_email: b.userId?.email
    }));

    res.json(rows);
  } catch (e) { next(e); }
}

export async function acceptBooking(req, res, next) {
  try {
    const ownerId = req.session.user.id;
    const id = req.params.id; // Mongoose ID is string

    const booking = await Booking.findById(id).populate('propertyId');
    if (!booking) return res.status(404).json({ error: 'Not found' });

    // Verify ownership
    if (String(booking.propertyId.ownerId) !== String(ownerId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (booking.status !== 'PENDING') return res.status(400).json({ error: 'Only PENDING can be accepted' });

    // Check overlap
    const conflicts = await Booking.find({
      propertyId: booking.propertyId._id,
      status: 'ACCEPTED',
      _id: { $ne: booking._id },
      $or: [
        { startDate: { $lt: booking.endDate }, endDate: { $gt: booking.startDate } }
      ]
    });

    if (conflicts.length) return res.status(409).json({ error: 'Dates already booked' });

    booking.status = 'ACCEPTED';
    await booking.save();

    // Publish status update
    await sendStatusUpdate({
      bookingId: booking._id,
      status: 'ACCEPTED',
      travelerId: booking.userId,
      propertyId: booking.propertyId._id
    }).catch(err => console.error("Kafka Status Publish Error:", err));

    res.json({ id: booking._id, status: 'ACCEPTED' });
  } catch (e) { next(e); }
}

export async function cancelBooking(req, res, next) {
  try {
    const ownerId = req.session.user.id;
    const id = req.params.id;

    const booking = await Booking.findById(id).populate('propertyId');
    if (!booking) return res.status(404).json({ error: 'Not found' });

    // Verify ownership
    if (String(booking.propertyId.ownerId) !== String(ownerId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (booking.status === 'CANCELLED') return res.json({ id: booking._id, status: 'CANCELLED' });

    booking.status = 'CANCELLED';
    await booking.save();

    // Publish status update
    await sendStatusUpdate({
      bookingId: booking._id,
      status: 'CANCELLED',
      travelerId: booking.userId,
      propertyId: booking.propertyId._id
    }).catch(err => console.error("Kafka Status Publish Error:", err));

    res.json({ id: booking._id, status: 'CANCELLED' });
  } catch (e) { next(e); }
}
