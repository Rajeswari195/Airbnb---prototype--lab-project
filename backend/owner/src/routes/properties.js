// owner/src/routes/properties.js
import { Router } from 'express';
import Property from '../models/Property.js';
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

    const property = new Property({
      ownerId: req.session.userId,
      title: p.title,
      type: p.type,
      description: p.description,
      amenities: p.amenities,
      price: p.price,
      address: p.address,
      city: p.city,
      location: p.city, // fallback
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      capacity: p.capacity,
      photos: []
    });
    await property.save();

    res.status(201).json({ id: property._id });
  } catch (e) {
    if (e.isJoi) return res.status(400).json({ error: 'Validation failed', details: e.details });
    next(e);
  }
});

/** PUT /api/properties/:id (edit details) */
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const p = await propSchema
      .fork(Object.keys(propSchema.describe().keys), (s) => s.optional())
      .validateAsync(req.body, { abortEarly: false });

    const property = await Property.findOne({ _id: id, ownerId: req.session.userId });
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (p.title) property.title = p.title;
    if (p.type) property.type = p.type;
    if (p.description !== undefined) property.description = p.description;
    if (p.amenities) property.amenities = p.amenities;
    if (p.price) property.price = p.price;
    if (p.address !== undefined) property.address = p.address;
    if (p.city) {
      property.city = p.city;
      property.location = p.city;
    }
    if (p.bedrooms) property.bedrooms = p.bedrooms;
    if (p.bathrooms) property.bathrooms = p.bathrooms;
    if (p.capacity) property.capacity = p.capacity;

    await property.save();
    res.json({ ok: true });
  } catch (e) {
    if (e.isJoi) return res.status(400).json({ error: 'Validation failed', details: e.details });
    next(e);
  }
});

/** GET /api/properties (list my properties) */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const properties = await Property.find({ ownerId: req.session.userId }).sort({ _id: -1 });

    const out = properties.map(p => ({
      id: p._id,
      title: p.title,
      type: p.type,
      price: p.price,
      city: p.city,
      address: p.address,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      capacity: p.capacity,
      amenities: p.amenities || []
    }));

    res.json(out);
  } catch (e) { next(e); }
});

/** GET /api/properties/:id */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const p = await Property.findOne({ _id: id, ownerId: req.session.userId });

    if (!p) return res.status(404).json({ error: 'Property not found' });

    res.json({
      id: p._id,
      title: p.title,
      type: p.type,
      description: p.description,
      amenities: p.amenities || [],
      price: p.price,
      address: p.address,
      city: p.city,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      capacity: p.capacity,
      photos: p.photos || []
    });
  } catch (e) { next(e); }
});

/** POST /api/properties/:id/photos (upload one photo) */
router.post('/:id/photos', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const absoluteUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const property = await Property.findOne({ _id: id, ownerId: req.session.userId });
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (!property.photos) property.photos = [];
    property.photos.push(absoluteUrl);

    // Also update images alias if used
    if (!property.images) property.images = [];
    property.images.push(absoluteUrl);

    await property.save();

    res.json({ url: absoluteUrl, photos: property.photos });
  } catch (e) { next(e); }
});

export default router;
