import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * POST /api/auth/exchange
 * Body: { token }
 * Verifies short-lived JWT from Traveler and sets Owner session.
 */
router.post('/exchange', (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token required' });

    const payload = jwt.verify(
      token,
      process.env.SSO_JWT_SECRET || 'dev_sso_secret',
      { issuer: 'traveler-api', audience: 'owner-api' }
    );

    // Keep both shapes for compatibility with existing code paths
    req.session.user = { id: payload.id, role: payload.role || 'traveler' };
    req.session.userId = payload.id;
    req.session.role = payload.role || 'traveler';

    return res.status(200).json({ ok: true, user: req.session.user });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
