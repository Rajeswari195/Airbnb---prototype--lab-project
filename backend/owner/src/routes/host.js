import { Router } from 'express';
import pool from '../db/pool.js';

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

    await pool.query('UPDATE users SET role=? WHERE id=?', ['owner', uid]);

    // Refresh both shapes to match existing code patterns
    req.session.user = { id: uid, role: 'owner' };
    req.session.userId = uid;
    req.session.role = 'owner';

    res.json({ ok: true, role: 'owner' });
  } catch (e) { next(e); }
});

export default router;
