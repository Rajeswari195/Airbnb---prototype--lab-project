import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

/**
 * POST /api/host/enable
 * Requires an Owner-service session (set after /api/auth/exchange).
 * Flips the user role to 'owner' and refreshes the session values.
 */
router.post('/enable', async (req, res, next) => {
  try {
    const uid = req.session?.userId;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    await User.findByIdAndUpdate(uid, { role: 'owner' });

    // Refresh both shapes to match existing code patterns
    req.session.user = { id: uid, role: 'owner' };
    req.session.userId = uid;
    req.session.role = 'owner';

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ ok: true, role: 'owner' });
  } catch (e) { next(e); }
});

export default router;
