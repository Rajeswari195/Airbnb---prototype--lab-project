import { Router } from 'express';
import pool from '../db/pool.js';
import requireAuth from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import Joi from 'joi';
import { fileURLToPath } from 'url';

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

/** GET /api/users/me */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const uid = req.session.userId;
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, about, city, state, country, languages, gender,
              avatar_url AS avatarUrl,
              role
         FROM users
        WHERE id = ?`,
      [uid]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const u = rows[0];
    if (typeof u.languages === 'string') {
      try { u.languages = JSON.parse(u.languages); } catch { u.languages = []; }
    }
    res.json(u);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/users/me */
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const uid = req.session.userId;
    const payload = await profileSchema.validateAsync(req.body, { abortEarly: false });

    const langsText = JSON.stringify(payload.languages || []);

    await pool.query(
      `UPDATE users
         SET name=?, email=?, phone=?, about=?, city=?, state=?, country=?, languages=?, gender=?
       WHERE id=?`,
      [
        payload.name,
        payload.email,
        payload.phone || '',
        payload.about || '',
        payload.city || '',
        payload.state || '',
        payload.country || '',
        langsText,
        payload.gender || '',
        uid
      ]
    );

    return res.json({ ok: true });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    // Validation errors
    if (err && err.isJoi) {
      return res.status(400).json({ error: 'Validation failed', details: err.details });
    }
    return next(err);
  }
});

/** POST /api/users/me/avatar (multipart/form-data with "file") */
router.post('/me/avatar', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const urlPath = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [urlPath, req.session.userId]);
    res.json({ avatarUrl: urlPath });
  } catch (err) {
    next(err);
  }
});

export default router;
