export default function requireAuth(req, res, next) {
  if (!req.session?.userId || req.session.role !== 'owner') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

  