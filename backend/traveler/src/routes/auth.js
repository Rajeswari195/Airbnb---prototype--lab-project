// backend/traveler/src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

/**
 * Helper: store traveler session consistently
 */
function setTravelerSession(req, user) {
  const mongoId = user._id.toString();

  req.session.userId = mongoId;
  req.session.mongoUserId = mongoId;
  req.session.role = 'traveler';
  req.session.user = {
    id: mongoId,
    email: user.email,
    name: user.name,
    role: 'traveler'
  };
}

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password required' });
    }

    const existing = await User.findOne({ email, role: 'traveler' });
    if (existing) {
      console.log('>>> [AUTH] Existing traveler found in Mongo for', email);
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Password hashing is handled by pre-save hook in User model, 
    // BUT the previous code hashed it manually. 
    // The User model I created has a pre-save hook.
    // So I should pass plain password if I use User.create, OR hash it if I want to be explicit.
    // The User model I created in Step 88 has:
    // userSchema.pre('save', async function(next) { ... if (!this.isModified('password')) return next(); ... bcrypt.hash ... })
    // So I can just pass 'password'.
    // However, to be safe and consistent with the previous code which might have expected hashed,
    // let's check the User model again. 
    // Step 88: 
    // userSchema.pre('save', ... this.password = await bcrypt.hash(this.password, 10); ...)
    // So if I pass plain password, it will be hashed.

    const user = new User({
      name,
      email,
      password, // Plain text, will be hashed by pre-save
      role: 'traveler'
    });
    console.log('>>> [AUTH] Saving new user with plain password:', password);
    await user.save();

    console.log('>>> [AUTH] Mongo traveler created:', {
      _id: user._id,
      email: user.email,
      role: user.role
    });

    // setTravelerSession(req, user); // Disable auto-login per user request

    res.status(201).json({
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (err) {
    console.error('>>> [AUTH] SIGNUP error:', err);
    next(err);
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Use the method on the user instance
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    setTravelerSession(req, user);

    res.json({
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (err) {
    console.error('>>> [AUTH] LOGIN error:', err);
    next(err);
  }
});

/**
 * POST /api/auth/logout
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
 * GET /api/auth/session
 */
router.get('/session', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(req.session.user);
});

/**
 * POST /api/auth/session-token
 * Short-lived JWT for owner SSO.
 */
router.post('/session-token', requireAuth, async (req, res) => {
  try {
    const mongoId = req.session.mongoUserId || req.session.userId;
    const user = await User.findById(mongoId);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = {
      id: mongoId,
      role: 'traveler'
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
  } catch (err) {
    console.error('>>> [AUTH] SESSION-TOKEN error:', err);
    res.status(500).json({ error: 'Could not generate token' });
  }
});

export default router;
