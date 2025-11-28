import { Router } from 'express';
import requireAuth from '../middleware/auth.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

const router = Router();

/** GET /api/dashboard  (previous bookings + recent requests) */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.session.userId;

    // Find properties owned by this user
    const properties = await Property.find({ ownerId }).select('_id title');
    const propertyIds = properties.map(p => p._id);

    if (propertyIds.length === 0) {
      return res.json({ recentRequests: [], previousBookings: [] });
    }

    // Recent requests (Pending/Accepted)
    const recent = await Booking.find({
      propertyId: { $in: propertyIds }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('propertyId', 'title')
      .lean();

    // Normalize for frontend
    const recentNormalized = recent.map(b => ({
      id: b._id,
      title: b.propertyId?.title,
      startDate: b.startDate,
      endDate: b.endDate,
      guests: b.guests,
      status: b.status
    }));

    // Previous bookings (Accepted and past date)
    const previous = await Booking.find({
      propertyId: { $in: propertyIds },
      endDate: { $lt: new Date() },
      status: 'ACCEPTED'
    })
      .sort({ endDate: -1 })
      .limit(10)
      .populate('propertyId', 'title')
      .lean();

    const previousNormalized = previous.map(b => ({
      id: b._id,
      title: b.propertyId?.title,
      startDate: b.startDate,
      endDate: b.endDate,
      guests: b.guests,
      status: b.status
    }));

    res.json({ recentRequests: recentNormalized, previousBookings: previousNormalized });
  } catch (e) { next(e); }
});

export default router;
