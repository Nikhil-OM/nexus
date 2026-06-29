import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, color } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = 'u' + Date.now(); // Keep consistent with frontend logic
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const user = new User({
      _id: id,
      email,
      password: hashedPassword,
      name,
      initials,
      role: role || 'Owner',
      color: color || '#7c3aed'
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
