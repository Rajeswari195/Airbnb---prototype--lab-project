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

    let where = 'WHERE 1=1';
    const params = [];

    if (location) {
      where += ' AND (p.city LIKE ? OR p.address LIKE ?)';
      params.push(`%${location}%`, `%${location}%`);
    }

    // First find all properties that match location & guests
    let baseQuery = `SELECT p.id, p.title, p.type, p.price, p.city, p.address,
                            p.bedrooms, p.bathrooms, p.capacity
                       FROM properties p
                     ${where}`;
    const [base] = await pool.query(baseQuery, params);

    // If date range provided, filter out unavailable ones
    let ids = base.map(b => b.id);
    if (startDate && endDate) {
      const availIds = await propertyIdsAvailable(startDate, endDate, Number(guests || 1));
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
              p.city, p.address, p.bedrooms, p.bathrooms, p.capacity
         FROM properties p
        WHERE p.id = ?`,
      [pid]
    );
    if (!p) return res.status(404).json({ error: 'Property not found' });

    // normalize amenities
    if (typeof p.amenities === 'string') {
      try { p.amenities = JSON.parse(p.amenities); } catch { p.amenities = []; }
    }

    // load photos/availability if you have tables for those
    res.json(p);
  } catch (err) {
    next(err);
  }
});

export default router;

