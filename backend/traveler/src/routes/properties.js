// backend/traveler/src/routes/properties.js
import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

/** helper: availability filter (no overlap with existing accepted/pending bookings) */
async function propertyIdsAvailable(startDate, endDate, guests) {
  const [rows] = await pool.query(
    `SELECT p.id
       FROM properties p
      WHERE p.capacity >= ?
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
           WHERE b.property_id = p.id
             AND b.status IN ('Pending','Accepted')
             AND ? <= b.end_date AND ? >= b.start_date
        )`,
    [guests || 1, startDate, endDate]
  );
  return rows.map(r => r.id);
}

/** GET /api/properties?location=&startDate=&endDate=&guests= */
router.get('/', async (req, res, next) => {
  try {
    const { location = '', startDate, endDate, guests } = req.query;

    const isISODate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
    const hasDates = isISODate(startDate) && isISODate(endDate);
    const safeGuests = Number.isFinite(Number(guests)) && Number(guests) > 0 ? Number(guests) : 1;
    const safeLocation = (location || '').trim();

    let where = 'WHERE 1=1';
    const params = [];

    if (safeLocation) {
      where += ' AND (p.city LIKE ? OR p.address LIKE ?)';
      params.push(`%${safeLocation}%`, `%${safeLocation}%`);
    }

    // Exclude own listings when logged in
    if (req.session?.userId) {
      where += ' AND (p.owner_id IS NULL OR p.owner_id <> ?)';
      params.push(req.session.userId);
    }

    // Enforce capacity whenever guests is provided works with or without dates
    if (guests && Number(guests) > 0) {
      where += ' AND p.capacity >= ?';
      params.push(safeGuests);
    }

    let baseQuery = `SELECT p.id, p.title, p.type, p.price, p.city, p.address,
                            p.bedrooms, p.bathrooms, p.capacity
                       FROM properties p
                     ${where}`;
    const [base] = await pool.query(baseQuery, params);

    // If a valid date range is provided, filter out unavailable ones
    let ids = base.map(b => b.id);
    if (hasDates && ids.length) {
      const availIds = await propertyIdsAvailable(startDate, endDate, safeGuests);
      const set = new Set(availIds);
      ids = ids.filter(id => set.has(id));
    }

    if (!ids.length) return res.json([]);

    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.type, p.price, p.city, p.address,
              p.bedrooms, p.bathrooms, p.capacity
         FROM properties p
        WHERE p.id IN (${placeholders})`,
      ids
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/** GET /api/properties/:id */
router.get('/:id', async (req, res, next) => {
  try {
    const pid = Number(req.params.id);
    const [[p]] = await pool.query(
      `SELECT p.id, p.title, p.type, p.description, p.amenities, p.price,
              p.city, p.address, p.bedrooms, p.bathrooms, p.capacity,
              p.photos
         FROM properties p
        WHERE p.id = ?`,
      [pid]
    );
    if (!p) return res.status(404).json({ error: 'Property not found' });

    // Parse JSON columns if they came back as strings
    if (typeof p.amenities === 'string') {
      try { p.amenities = JSON.parse(p.amenities); } catch { p.amenities = []; }
    }
    if (typeof p.photos === 'string') {
      try { p.photos = JSON.parse(p.photos); } catch { p.photos = []; }
    }

    res.json(p);
  } catch (err) {
    next(err);
  }
});

export default router;
