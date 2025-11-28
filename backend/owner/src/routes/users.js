import { Router } from 'express';
import requireAuth from '../middleware/auth.js';
import User from '../models/User.js';
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
    const u = await User.findById(req.session.userId).select('id name email city phone about');
    if (!u) return res.status(404).json({ error: 'User not found' });

    // Normalize response to match frontend expectations (city -> location)
    res.json({
      id: u._id,
      name: u.name,
      email: u.email,
      location: u.city,
      phone: u.phone,
      about: u.about
    });
  } catch (e) { next(e); }
});

/** PUT /api/users/me */
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const p = await schema.validateAsync(req.body, { abortEarly: false });

    const updates = {};
    if (p.name !== undefined) updates.name = p.name;
    if (p.location !== undefined) updates.city = p.location;
    if (p.phone !== undefined) updates.phone = p.phone;
    if (p.about !== undefined) updates.about = p.about;

    await User.findByIdAndUpdate(req.session.userId, updates);
    res.json({ ok: true });
  } catch (e) {
    if (e.isJoi) return res.status(400).json({ error: 'Validation failed', details: e.details });
    next(e);
  }
});

export default router;
