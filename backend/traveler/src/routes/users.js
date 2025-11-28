// backend/traveler/src/routes/users.js
import { Router } from "express";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = Router();

function getMongoIdFromSession(req) {
  if (!req.session) return null;
  return (
    req.session.mongoUserId ||
    (req.session.user && req.session.user.id) ||
    req.session.userId ||
    null
  );
}

/**
 * GET /api/users/me
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const mongoId = getMongoIdFromSession(req);
    if (!mongoId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(mongoId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role || "traveler",
      about: user.about || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "",
      phone: user.phone || "",
      languages: user.languages || [],
      gender: user.gender || "",
      avatarUrl: user.avatar_url || user.avatarUrl || "",
    });
  } catch (err) {
    console.error(">>> [USERS] GET /me error:", err);
    return res.status(500).json({ error: "Could not fetch profile" });
  }
});

/**
 * PUT /api/users/me
 */
router.put("/me", requireAuth, async (req, res) => {
  try {
    const mongoId = getMongoIdFromSession(req);
    if (!mongoId) return res.status(401).json({ error: "Unauthorized" });

    const allowedFields = [
      "name",
      "about",
      "city",
      "state",
      "country",
      "phone",
      "languages",
      "gender",
    ];
    const updates = {};
    for (const f of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        updates[f] = req.body[f];
      }
    }

    const user = await User.findByIdAndUpdate(
      mongoId,
      { $set: updates },
      { new: true }
    ).lean();

    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.session.user) {
      req.session.user.name = user.name;
    }

    return res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role || "traveler",
      about: user.about || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "",
      phone: user.phone || "",
      languages: user.languages || [],
      gender: user.gender || "",
      avatarUrl: user.avatar_url || user.avatarUrl || "",
    });
  } catch (err) {
    console.error(">>> [USERS] PUT /me error:", err);
    return res.status(500).json({ error: "Could not update profile" });
  }
});

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Setup Multer Storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/**
 * POST /api/users/me/avatar
 * Uploads a profile picture and updates the user record.
 */
router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    const mongoId = getMongoIdFromSession(req);
    if (!mongoId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Construct public URL (assuming app.js serves /uploads)
    const avatarUrl = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      mongoId,
      { $set: { avatarUrl: avatarUrl } },
      { new: true }
    ).lean();

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      avatarUrl: user.avatarUrl
    });
  } catch (err) {
    console.error('>>> [USERS] Avatar upload error:', err);
    res.status(500).json({ error: 'Could not upload avatar' });
  }
});

export default router;
