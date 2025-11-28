// backend/traveler/src/routes/properties.js
import { Router } from "express";
import Property from "../models/Property.js";
import Booking from "../models/Booking.js";

const router = Router();

/**
 * Helper: return IDs of properties that are available for the given dates
 * and have enough capacity.
 */
async function getAvailablePropertyIds(startDate, endDate) {
  // Find bookings that overlap with the requested range
  // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
  const conflictingBookings = await Booking.find({
    status: { $in: ['Pending', 'Accepted'] },
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) }
  }).select('propertyId');

  const conflictingIds = conflictingBookings.map(b => b.propertyId.toString());
  return new Set(conflictingIds);
}

/** GET /api/properties?location=&startDate=&endDate=&guests= */
router.get("/", async (req, res, next) => {
  try {
    const { location = "", startDate, endDate, guests } = req.query;

    const query = {};

    // Location filter (case-insensitive regex)
    if (location && location.trim()) {
      const regex = new RegExp(location.trim(), 'i');
      query.$or = [
        { city: regex },
        { address: regex },
        { location: regex }
      ];
    }

    // Exclude own listings if logged in
    if (req.session?.mongoUserId) {
      query.ownerId = { $ne: req.session.mongoUserId };
    }

    // Capacity filter
    if (guests && Number(guests) > 0) {
      query.capacity = { $gte: Number(guests) };
    }

    // Date availability filter
    if (startDate && endDate) {
      const conflictingIds = await getAvailablePropertyIds(startDate, endDate);
      if (conflictingIds.size > 0) {
        query._id = { $nin: Array.from(conflictingIds) };
      }
    }

    const properties = await Property.find(query);

    // Normalize output to match frontend expectations
    const normalized = properties.map(p => ({
      id: p._id,
      title: p.title,
      type: p.type,
      price: p.price,
      city: p.city || p.location,
      address: p.address,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      capacity: p.capacity,
      photos: p.photos || p.images || []
    }));

    res.json(normalized);
  } catch (err) {
    next(err);
  }
});

/** GET /api/properties/:id */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ error: "Property not found" });
    }

    const p = await Property.findById(id);

    if (!p) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json({
      id: p._id,
      title: p.title,
      type: p.type,
      description: p.description,
      amenities: p.amenities || [],
      price: p.price,
      city: p.city || p.location,
      address: p.address,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      capacity: p.capacity,
      photos: p.photos || p.images || []
    });
  } catch (err) {
    next(err);
  }
});

export default router;
