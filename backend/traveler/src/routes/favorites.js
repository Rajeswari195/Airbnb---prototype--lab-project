import { Router } from 'express';
import requireAuth from '../middleware/auth.js';
import Favorite from '../models/Favorite.js';

const router = Router();

/** GET /api/favorites */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.session.mongoUserId })
      .populate('propertyId');

    // Normalize
    const rows = favorites.map(f => ({
      id: f._id,
      property_id: f.propertyId._id,
      title: f.propertyId.title,
      city: f.propertyId.city,
      price: f.propertyId.price,
      photos: f.propertyId.photos || []
    }));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/** POST /api/favorites { propertyId } */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { propertyId } = req.body || {};
    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId required' });
    }

    // Check if already exists
    const existing = await Favorite.findOne({
      userId: req.session.mongoUserId,
      propertyId: propertyId
    });

    if (existing) {
      return res.status(200).json(existing); // Idempotent
    }

    const fav = new Favorite({
      userId: req.session.mongoUserId,
      propertyId: propertyId
    });
    await fav.save();

    res.status(201).json({ id: fav._id, property_id: propertyId });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/favorites/:id */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    await Favorite.findByIdAndDelete(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
