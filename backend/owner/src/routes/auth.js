// backend/owner/src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/pool.js';
import User from '../models/User.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Owner signup:
 *  - Stores owner in MySQL (existing behavior)
 *  - Also stores owner in MongoDB (role = 'owner')
 */
router.post('/signup', async (req, res, next) => {
  console.log('>>> [OWNER AUTH] SIGNUP handler reached, body =', req.body);
  try {
    const { name, email, password, location } = req.body || {};
    if (!name || !email || !password || !location) {
      return res
        .status(400)
        .json({ error: 'name, email, password, location required' });
    }

    // Check Mongo for existing owner with same email
    const existingMongo = await User.findOne({ email, role: 'owner' });
    if (existingMongo) {
      console.log('>>> [OWNER AUTH] Existing owner found in Mongo for', email);
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert into MySQL users table
    const [r] = await pool.query(
      'INSERT INTO users (name,email,password_hash,role,city) VALUES (?,?,?,?,?)',
      [name, email, hash, 'owner', location]
    );

    const ownerId = r.insertId;
    console.log('>>> [OWNER AUTH] MySQL owner created with id =', ownerId);

    // Create corresponding Mongo user document
    const mongoUser = await User.create({
      email,
      passwordHash: hash,
      role: 'owner',
      name,
      city: location
    });

    console.log('>>> [OWNER AUTH] Mongo owner created:', {
      _id: mongoUser._id,
      email: mongoUser.email,
      role: mongoUser.role
    });

    // Session uses MySQL owner id (keep existing behavior)
    req.session.userId = ownerId;
    req.session.role = 'owner';

    // Response: expose Mongo _id as id, but also show MySQL id
    res.status(201).json({
      id: String(mongoUser._id),
      ownerIdMySQL: ownerId,
      source: 'owner-mongo-auth', // tag for debugging
      name,
      email,
      location,
      role: 'owner'
    });
  } catch (e) {
    console.error('>>> [OWNER AUTH] SIGNUP error:', e);
    next(e);
  }
});

/**
 * POST /api/auth/login
 *  - Verifies owner via MySQL (existing behavior)
 *  - Upserts owner into MongoDB
 */
router.post('/login', async (req, res, next) => {
  console.log('>>> [OWNER AUTH] LOGIN handler reached, body =', req.body);
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email, password required' });
    }

    // Look up owner in MySQL
    const [rows] = await pool.query(
      'SELECT id,name,email,password_hash,role,city FROM users WHERE email=?',
      [email]
    );

    if (!rows.length) {
      console.log('>>> [OWNER AUTH] No MySQL owner for email', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const u = rows[0];

    if (u.role !== 'owner') {
      return res.status(403).json({ error: 'Not an owner account' });
    }

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      console.log('>>> [OWNER AUTH] Password mismatch for email', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Upsert owner into Mongo to keep it synced
    const mongoOwner = await User.findOneAndUpdate(
      { email: u.email, role: 'owner' },
      {
        email: u.email,
        passwordHash: u.password_hash,
        role: 'owner',
        name: u.name,
        city: u.city
      },
      { upsert: true, new: true }
    );

    console.log('>>> [OWNER AUTH] Mongo owner upserted:', {
      _id: mongoOwner._id,
      email: mongoOwner.email,
      role: mongoOwner.role
    });

    // Keep session userId as MySQL id
    req.session.userId = u.id;
    req.session.role = 'owner';

    res.json({
      id: u.id,
      source: 'owner-mongo-auth', // tag
      name: u.name,
      email: u.email,
      location: u.city,
      role: 'owner'
    });
  } catch (e) {
    console.error('>>> [OWNER AUTH] LOGIN error:', e);
    next(e);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  console.log('>>> [OWNER AUTH] LOGOUT called');
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('owner_sid'); // match cookie name in app.js
      res.status(204).end();
    });
  } else {
    res.status(204).end();
  }
});

export default router;
