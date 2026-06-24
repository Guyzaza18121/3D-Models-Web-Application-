import { Router } from 'express';
import mongoose   from 'mongoose';
import Sensor      from '../models/Sensor.js';
import Log         from '../models/Log.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const isOid = (v) => mongoose.Types.ObjectId.isValid(v);

router.get('/', async (req, res) => {
  res.json(await Sensor.find());
});

router.post('/', allow('ADMIN','ENGINEER'), async (req, res) => {
  const doc = await Sensor.create(req.body);
  await Log.create({ type: 'CFG', msg: `เพิ่ม Sensor: ${doc.name} (${doc.type})`, who: req.user.name });
  res.status(201).json(doc);
});

router.put('/:id', allow('ADMIN','ENGINEER'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  const doc = await Sensor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await Log.create({ type: 'CFG', msg: `แก้ไข Sensor: ${doc.name}`, who: req.user.name });
  res.json(doc);
});

router.delete('/:id', allow('ADMIN','ENGINEER'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  await Sensor.findByIdAndDelete(req.params.id);
  res.json({ id: req.params.id });
});

export default router;
