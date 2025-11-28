// backend/owner/src/middleware/auth.js

export default function requireAuth(req, res, next) {
  try {
    const hasUser =
      req.session &&
      (req.session.userId || (req.session.user && req.session.user.id));

    if (!hasUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return next();
  } catch (err) {
    console.error(">>> [OWNER][AUTH MIDDLEWARE] error:", err);
    return res.status(500).json({ error: "Auth middleware error" });
  }
}
