import { Router } from 'express';
import jwt         from 'jsonwebtoken';
import User        from '../models/User.js';
import Log         from '../models/Log.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { un, pw } = req.body;
    if (!un || !pw) return res.status(400).json({ message: 'un and pw required' });

    const user = await User.findOne({ un, on: true });
    if (!user || !(await user.matchPassword(pw)))
      return res.status(401).json({ message: 'Invalid credentials' });

    user.lastLogin = new Date().toLocaleString('th-TH', { hour12: false });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await Log.create({ type: 'AUTH', msg: `เข้าสู่ระบบ: ${user.name} (${user.role})`, who: user.name });

    res.json({
      token,
      user: { id: user._id, un: user.un, name: user.name, role: user.role, avatar: user.avatar, on: user.on, lastLogin: user.lastLogin },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/logout', protect, async (req, res) => {
  await Log.create({ type: 'AUTH', msg: `ออกจากระบบ: ${req.user.name}`, who: req.user.name });
  res.json({ message: 'Logged out' });
});

export default router;
