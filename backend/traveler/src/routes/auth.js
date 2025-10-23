import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/pool.js';

const router = Router();

/** POST /api/auth/signup */
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password required' });
    }

    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, 'traveler']
    );

    req.session.userId = result.insertId;
    req.session.role = 'traveler';
    res.status(201).json({ id: result.insertId, name, email, role: 'traveler' });
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/login */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email, password required' });
    }
    const [rows] = await pool.query('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = user.id;
    req.session.role = user.role || 'traveler';
    res.json({ id: user.id, name: user.name, email: user.email, role: req.session.role });
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/logout */
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('sid');
      res.status(204).end();
    });
  } else {
    res.status(204).end();
  }
});

export default router;
