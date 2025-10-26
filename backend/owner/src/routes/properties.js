// owner/src/routes/properties.js
import { Router } from 'express';
import pool from '../db/pool.js';
import requireAuth from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Joi from 'joi';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `prop_${req.session.userId}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

const propSchema = Joi.object({
  title: Joi.string().min(3).max(120).required(),
  type: Joi.string().max(60).required(),
  description: Joi.string().allow(''),
  amenities: Joi.array().items(Joi.string()).default([]),
  price: Joi.number().positive().required(),
  address: Joi.string().max(255).allow(''),
  city: Joi.string().max(80).required(),
  bedrooms: Joi.number().integer().min(0).required(),
  bathrooms: Joi.number().integer().min(0).required(),
  capacity: Joi.number().integer().min(1).required()
});

/** POST /api/properties  (create/post property) */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const p = await propSchema.validateAsync(req.body, { abortEarly: false });
    const [r] = await pool.query(
      `INSERT INTO properties
        (owner_id,title,type,description,amenities,price,address,city,bedrooms,bathrooms,capacity)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [req.session.userId, p.title, p.type, p.description || '',
       JSON.stringify(p.amenities || []), p.price, p.address || '', p.city,
       p.bedrooms, p.bathrooms, p.capacity]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.isJoi) return res.status(400).json({ error: 'Validation failed', details: e.details });
    next(e);
  }
});

/** PUT /api/properties/:id (edit details) */
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const pid = Number(req.params.id);
    const p = await propSchema.fork(Object.keys(propSchema.describe().keys), (s)=>s.optional())
                              .validateAsync(req.body, { abortEarly: false });
    await pool.query(
      `UPDATE properties SET
         title=COALESCE(?,title), type=COALESCE(?,type), description=COALESCE(?,description),
         amenities=COALESCE(?,amenities), price=COALESCE(?,price), address=COALESCE(?,address),
         city=COALESCE(?,city), bedrooms=COALESCE(?,bedrooms), bathrooms=COALESCE(?,bathrooms),
         capacity=COALESCE(?,capacity)
       WHERE id=? AND owner_id=?`,
      [p.title ?? null, p.type ?? null, p.description ?? null,
       p.amenities ? JSON.stringify(p.amenities) : null, p.price ?? null, p.address ?? null,
       p.city ?? null, p.bedrooms ?? null, p.bathrooms ?? null, p.capacity ?? null,
       pid, req.session.userId]
    );
    res.json({ ok: true });
  } catch (e) {
    if (e.isJoi) return res.status(400).json({ error: 'Validation failed', details: e.details });
    next(e);
  }
});

/** GET /api/properties (list my properties) */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id,title,type,price,city,address,bedrooms,bathrooms,capacity,amenities
         FROM properties WHERE owner_id=? ORDER BY id DESC`,
      [req.session.userId]
    );

    const out = rows.map(r => {
      if (typeof r.amenities === 'string') {
        try { r.amenities = JSON.parse(r.amenities); } catch { r.amenities = []; }
      }
      return r;
    });

    res.json(out);
  } catch (e) { next(e); }
});

/** GET /api/properties/:id */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const pid = Number(req.params.id);
    const [[p]] = await pool.query(
      `SELECT id,title,type,description,amenities,price,address,city,bedrooms,bathrooms,capacity
         FROM properties WHERE id=? AND owner_id=?`,
      [pid, req.session.userId]
    );
    if (!p) return res.status(404).json({ error: 'Property not found' });
    if (typeof p.amenities === 'string') { try { p.amenities = JSON.parse(p.amenities); } catch { p.amenities = []; } }
    res.json(p);
  } catch (e) { next(e); }
});

/** POST /api/properties/:id/photos (upload one photo) */
router.post('/:id/photos', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (e) { next(e); }
});

export default router;
