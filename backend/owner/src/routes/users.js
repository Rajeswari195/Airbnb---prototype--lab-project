import { Router } from 'express';
import pool from '../db/pool.js';
import requireAuth from '../middleware/auth.js';
import Joi from 'joi';

const router = Router();

const schema = Joi.object({
  name: Joi.string().min(2).max(80),
  location: Joi.string().max(120),
  phone: Joi.string().allow(''),
  about: Joi.string().max(500).allow('')
});

/** GET /api/users/me */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [[u]] = await pool.query(
      `SELECT id, name, email, city AS location, phone, about
         FROM users WHERE id=?`, [req.session.userId]
    );
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json(u);
  } catch (e) { next(e); }
});

/** PUT /api/users/me */
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const p = await schema.validateAsync(req.body, { abortEarly: false });
    await pool.query(
      `UPDATE users SET name=COALESCE(?,name), city=COALESCE(?,city),
                        phone=COALESCE(?,phone), about=COALESCE(?,about)
        WHERE id=?`,
      [p.name ?? null, p.location ?? null, p.phone ?? null, p.about ?? null, req.session.userId]
    );
    res.json({ ok: true });
  } catch (e) {
    if (e.isJoi) return res.status(400).json({ error: 'Validation failed', details: e.details });
    next(e);
  }
});

export default router;
