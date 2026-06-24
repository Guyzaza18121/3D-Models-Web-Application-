import { Router } from 'express';
import mongoose   from 'mongoose';
import bcrypt      from 'bcryptjs';
import User        from '../models/User.js';
import Log         from '../models/Log.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const isOid = (v) => mongoose.Types.ObjectId.isValid(v);

router.get('/', allow('ADMIN'), async (req, res) => {
  const users = await User.find().select('-pwHash').sort('name');
  res.json(users);
});

router.post('/', allow('ADMIN'), async (req, res) => {
  const { un, pw, name, role } = req.body;
  if (!un || !pw || !name) return res.status(400).json({ message: 'un, pw, name required' });
  if (await User.findOne({ un })) return res.status(400).json({ message: 'Username already taken' });

  const pwHash = await bcrypt.hash(pw, 10);
  const user   = await User.create({ un, pwHash, name, role: role || 'OPERATOR' });
  await Log.create({ type: 'AUTH', msg: `เพิ่มผู้ใช้: ${name} (${user.role})`, who: req.user.name });
  res.status(201).json({ id: user._id, un: user.un, name: user.name, role: user.role, on: user.on });
});

router.put('/:id', allow('ADMIN'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  const update = { ...req.body };
  if (update.pw) {
    update.pwHash = await bcrypt.hash(update.pw, 10);
    delete update.pw;
  }
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-pwHash');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

router.delete('/:id', allow('ADMIN'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  await User.findByIdAndUpdate(req.params.id, { on: false });
  res.json({ id: req.params.id });
});

export default router;
