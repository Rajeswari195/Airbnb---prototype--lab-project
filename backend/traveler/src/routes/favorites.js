import { Router } from 'express';
import pool from '../db/pool.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

/** POST /api/favorites  { propertyId } */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { propertyId } = req.body || {};
    if (!propertyId) return res.status(400).json({ error: 'propertyId required' });

    // avoid duplicates
    await pool.query(
      'INSERT IGNORE INTO favorites (user_id, property_id) VALUES (?, ?)',
      [req.session.userId, propertyId]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** GET /api/favorites */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.id, p.id AS propertyId, p.title, p.city, p.price
         FROM favorites f
         JOIN properties p ON p.id = f.property_id
        WHERE f.user_id = ?
        ORDER BY f.id DESC`,
      [req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/favorites/:id  (id = favorites.id) */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const favId = Number(req.params.id);
    await pool.query('DELETE FROM favorites WHERE id = ? AND user_id = ?', [favId, req.session.userId]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
