// backend/traveler/src/controllers/travelerAuthController.js
import bcrypt from 'bcrypt';
import User from '../models/User.js';

// SIGNUP (Traveler)
export async function travelerSignup(req, res) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ email, role: 'traveler' });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      role: 'traveler',
      name
    });

    res.status(201).json({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    });
  } catch (err) {
    console.error('Traveler signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// LOGIN (Traveler)
export async function travelerLogin(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'traveler' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Mongo-backed session
    req.session.userId = user._id.toString();
    req.session.role = user.role;

    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    });
  } catch (err) {
    console.error('Traveler login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
