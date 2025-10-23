import { Router } from 'express';
import pool from '../db/pool.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

/** GET /api/dashboard  (previous bookings + recent requests) */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.session.userId;

    const [recent] = await pool.query(
      `SELECT b.id, p.title, b.start_date AS startDate, b.end_date AS endDate, b.guests, b.status
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
        WHERE p.owner_id = ?
        ORDER BY b.created_at DESC
        LIMIT 10`,
      [ownerId]
    );

    const [previous] = await pool.query(
      `SELECT b.id, p.title, b.start_date AS startDate, b.end_date AS endDate, b.guests, b.status
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
        WHERE p.owner_id = ? AND b.end_date < CURDATE() AND b.status='Accepted'
        ORDER BY b.end_date DESC
        LIMIT 10`,
      [ownerId]
    );

    res.json({ recentRequests: recent, previousBookings: previous });
  } catch (e) { next(e); }
});

export default router;
