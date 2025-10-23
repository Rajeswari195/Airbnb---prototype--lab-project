import { Router } from 'express';
import pool from '../db/pool.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

/** GET /api/bookings/incoming  (pending/accepted/cancelled for my properties) */
router.get('/incoming', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.user_id AS travelerId, b.property_id AS propertyId,
              b.start_date AS startDate, b.end_date AS endDate,
              b.guests, b.status, p.title, p.city
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
        WHERE p.owner_id = ?
        ORDER BY b.created_at DESC`,
      [req.session.userId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

/** POST /api/bookings/:id/accept */
router.post('/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const bid = Number(req.params.id);

    // ensure this booking belongs to my property
    const [[b]] = await pool.query(
      `SELECT b.id, b.property_id, b.status
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
        WHERE b.id=? AND p.owner_id=?`,
      [bid, req.session.userId]
    );
    if (!b) return res.status(404).json({ error: 'Booking not found' });
    if (b.status === 'Accepted') return res.json({ ok: true, status: 'Accepted' });

    await pool.query(`UPDATE bookings SET status='Accepted' WHERE id=?`, [bid]);
    // Traveler side already blocks Accepted in availability checks
    res.json({ ok: true, status: 'Accepted' });
  } catch (e) { next(e); }
});

/** POST /api/bookings/:id/cancel */
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const bid = Number(req.params.id);
    const [[b]] = await pool.query(
      `SELECT b.id
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
        WHERE b.id=? AND p.owner_id=?`,
      [bid, req.session.userId]
    );
    if (!b) return res.status(404).json({ error: 'Booking not found' });

    await pool.query(`UPDATE bookings SET status='Cancelled' WHERE id=?`, [bid]);
    res.json({ ok: true, status: 'Cancelled' });
  } catch (e) { next(e); }
});

export default router;
