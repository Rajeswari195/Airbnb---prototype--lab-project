// backend/traveler/src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Traveler signup: stores user in MongoDB with encrypted password.
 */
router.post('/signup', async (req, res, next) => {
  console.log('>>> [AUTH] Mongo SIGNUP handler reached, body =', req.body);
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password required' });
    }

    // Check if traveler already exists in Mongo
    const existing = await User.findOne({ email, role: 'traveler' });
    if (existing) {
      console.log('>>> [AUTH] Existing traveler found in Mongo for', email);
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Create traveler user in Mongo
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'traveler'
    });

    console.log('>>> [AUTH] Mongo traveler created:', {
      _id: user._id,
      email: user.email,
      role: user.role
    });

    // Store session info (Mongo-backed session store)
    req.session.userId = user._id.toString();
    req.session.role = 'traveler';

    res.status(201).json({
      id: String(user._id),
      source: 'traveler-mongo-auth',      // 👈 unmistakable
      name: user.name,
      email: user.email,
      role: 'traveler'
    });
  } catch (err) {
    console.error('>>> [AUTH] SIGNUP error:', err);
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Traveler login: verifies Mongo user with bcrypt and sets session.
 */
router.post('/login', async (req, res, next) => {
  console.log('>>> [AUTH] Mongo LOGIN handler reached, body =', req.body);
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email, password required' });
    }

    // Find traveler in Mongo
    const user = await User.findOne({ email, role: 'traveler' });
    if (!user) {
      console.log('>>> [AUTH] No Mongo traveler for email', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log('>>> [AUTH] Password mismatch for email', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set Mongo-backed session
    req.session.userId = user._id.toString();
    req.session.role = user.role || 'traveler';

    res.json({
      id: String(user._id),
      source: 'traveler-mongo-auth',      // 👈 same tag
      name: user.name,
      email: user.email,
      role: req.session.role
    });
  } catch (err) {
    console.error('>>> [AUTH] LOGIN error:', err);
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Clears the session and cookie.
 */
router.post('/logout', (req, res) => {
  console.log('>>> [AUTH] LOGOUT called');
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('sid');
      res.status(204).end();
    });
  } else {
    res.status(204).end();
  }
});

/**
 * POST /api/auth/session-token
 * Returns a short-lived token (120s) representing the current session
 * for Owner API to exchange and set its own session.
 */
router.post('/session-token', requireAuth, (req, res) => {
  console.log('>>> [AUTH] SESSION-TOKEN for userId =', req.session.userId);
  const payload = {
    id: req.session.userId,
    role: req.session.role || 'traveler'
  };

  const token = jwt.sign(
    payload,
    process.env.SSO_JWT_SECRET || 'dev_sso_secret',
    {
      expiresIn: '120s',
      issuer: 'traveler-api',
      audience: 'owner-api'
    }
  );

  res.json({ token });
});

export default router;
