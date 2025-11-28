// backend/owner/src/routes/auth.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = Router();

// shared with traveler
const SSO_SECRET = process.env.SSO_JWT_SECRET || "dev_sso_secret";

/**
 * POST /api/auth/exchange
 * NOTE: NO requireAuth here – this is how the user gets an owner session.
 */
router.post("/exchange", async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    console.log(">>> [OWNER] EXCHANGE token snippet:", token.slice(0, 16), "...");

    const payload = jwt.verify(token, SSO_SECRET);
    console.log(">>> [OWNER] EXCHANGE payload:", payload);

    const user = await User.findById(payload.id);

    if (!user) {
      console.error(">>> [OWNER] EXCHANGE user not found id =", payload.id);
      return res.status(404).json({ error: "User not found" });
    }

    req.session.userId = user._id.toString();
    req.session.role = "owner";
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: "owner",
    };

    console.log(">>> [OWNER] SSO EXCHANGE success for", user.email);
    return res.json({
      ok: true, user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error(">>> [OWNER] EXCHANGE error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

/**
 * POST /api/host/enable
 * Flip role to owner.
 */
router.post("/host/enable", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await User.findByIdAndUpdate(userId, { role: 'owner' });

    req.session.role = "owner";
    if (req.session.user) req.session.user.role = "owner";

    return res.json({ ok: true });
  } catch (err) {
    console.error(">>> [OWNER] ENABLE error:", err);
    return res.status(500).json({ error: "Could not enable host" });
  }
});

export default router;
