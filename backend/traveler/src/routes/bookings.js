import { Router } from 'express';
import pool from '../db/pool.js';
import requireAuth from '../middleware/auth.js';
import Joi from 'joi';

const router = Router();

const createSchema = Joi.object({
  propertyId: Joi.number().integer().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  guests: Joi.number().integer().min(1).required(),
});

/** POST /api/bookings  (create Pending booking) */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = await createSchema.validateAsync(req.body, { abortEarly: false });
    const { propertyId, startDate, endDate, guests } = payload;

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'endDate must be after startDate' });
    }

    // capacity check
    const [[prop]] = await pool.query('SELECT capacity FROM properties WHERE id = ?', [propertyId]);
    if (!prop) return res.status(404).json({ error: 'Property not found' });
    if (guests > prop.capacity) return res.status(400).json({ error: 'Guests exceed capacity' });

    // overlap check (Pending/Accepted)
    const [overlap] = await pool.query(
      `SELECT 1 FROM bookings
        WHERE property_id = ?
          AND status IN ('Pending','Accepted')
          AND ? <= end_date AND ? >= start_date
        LIMIT 1`,
      [propertyId, startDate, endDate]
    );
    if (overlap.length) {
      return res.status(409).json({ error: 'Property not available for those dates' });
    }

    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, property_id, start_date, end_date, guests, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [req.session.userId, propertyId, startDate, endDate, guests]
    );
    res.status(201).json({ id: result.insertId, status: 'Pending' });
  } catch (err) {
    if (err.isJoi) return res.status(400).json({ error: 'Validation failed', details: err.details });
    next(err);
  }
});

/** GET /api/bookings?status=Pending|Accepted|Cancelled&scope=past */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, scope } = req.query;
    const where = ['b.user_id = ?'];
    const params = [req.session.userId];

    if (status) {
      where.push('b.status = ?');
      params.push(status);
    }
    if (scope === 'past') {
      where.push('b.end_date < CURDATE()');
    }

    const [rows] = await pool.query(
      `SELECT b.id, b.property_id AS propertyId, b.start_date AS startDate, b.end_date AS endDate,
              b.guests, b.status, p.title, p.city, p.price
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
        WHERE ${where.join(' AND ')}
        ORDER BY b.start_date DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
