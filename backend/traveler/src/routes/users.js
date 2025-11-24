// backend/traveler/src/routes/users.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import Joi from 'joi';
import { fileURLToPath } from 'url';

import requireAuth from '../middleware/auth.js';
import User from '../models/User.js';   // 🔹 Mongo traveler profile
import pool from '../db/pool.js';       // 🔹 MySQL pool (for role/source of truth)

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage for avatar uploads
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.session.userId}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

const allowedCountries = [
  'United States', 'Canada', 'India', 'United Kingdom', 'Australia',
  'Germany', 'France', 'Singapore', 'Japan', 'Mexico'
];

const profileSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow(''),
  about: Joi.string().max(500).allow(''),
  city: Joi.string().allow(''),
  state: Joi.string().uppercase().length(2).allow(''), // abbreviated
  country: Joi.string().valid(...allowedCountries).allow(''),
  languages: Joi.array().items(Joi.string()).default([]),
  gender: Joi.string().valid('Female', 'Male', 'Non-binary', 'Prefer not to say', '').allow(''),
});

/**
 * Helper: get role from MySQL by email (source of truth for owner/traveler).
 * If anything fails, it returns null and we fall back to Mongo's role.
 */
async function getRoleFromMySQL(email) {
  if (!email) return null;
  try {
    const [rows] = await pool.query(
      'SELECT role FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (rows.length && rows[0].role) {
      return rows[0].role;
    }
  } catch (err) {
    console.error('[Traveler users] Failed to read role from MySQL:', err.message);
  }
  return null;
}

/**
 * GET /api/users/me
 * 🔹 Reads traveler profile from MongoDB User document.
 * 🔹 Role is resolved from MySQL if possible (so owner-role flip is visible in UI).
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const uid = req.session.userId;

    const user = await User.findById(uid).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prefer MySQL role (where /api/host/enable updates role to 'owner')
    let role = user.role || 'traveler';
    const mysqlRole = await getRoleFromMySQL(user.email);
    if (mysqlRole) {
      role = mysqlRole;
    }

    const payload = {
      id: String(user._id),
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      about: user.about || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      languages: Array.isArray(user.languages) ? user.languages : [],
      gender: user.gender || '',
      avatarUrl: user.avatarUrl || '',
      role,
    };

    return res.json(payload);
  } catch (err) {
    return next(err);
  }
});

/**
 * PUT /api/users/me
 * 🔹 Updates profile fields in MongoDB User document.
 *    Returns the updated profile object (same shape as GET /me).
 */
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const uid = req.session.userId;
    const payload = await profileSchema.validateAsync(req.body, { abortEarly: false });

    const update = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      about: payload.about || '',
      city: payload.city || '',
      state: payload.state || '',
      country: payload.country || '',
      languages: payload.languages || [],
      gender: payload.gender || '',
    };

    const user = await User.findByIdAndUpdate(uid, update, {
      new: true,
      runValidators: false,
    }).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Again, resolve latest role from MySQL if present
    let role = user.role || 'traveler';
    const mysqlRole = await getRoleFromMySQL(user.email);
    if (mysqlRole) {
      role = mysqlRole;
    }

    const response = {
      id: String(user._id),
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      about: user.about || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      languages: Array.isArray(user.languages) ? user.languages : [],
      gender: user.gender || '',
      avatarUrl: user.avatarUrl || '',
      role,
    };

    return res.json(response);
  } catch (err) {
    // Duplicate email
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    // Joi validation errors
    if (err && err.isJoi) {
      return res.status(400).json({ error: 'Validation failed', details: err.details });
    }
    return next(err);
  }
});

/**
 * POST /api/users/me/avatar
 * 🔹 Saves avatar file to disk and stores URL path in Mongo User document.
 */
router.post('/me/avatar', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const urlPath = `/uploads/${req.file.filename}`;

    await User.findByIdAndUpdate(req.session.userId, { avatarUrl: urlPath });

    return res.json({ avatarUrl: urlPath });
  } catch (err) {
    return next(err);
  }
});

export default router;
