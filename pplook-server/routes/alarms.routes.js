import { Router } from 'express';
import mongoose   from 'mongoose';
import Alarm       from '../models/Alarm.js';
import Log         from '../models/Log.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const isOid = (v) => mongoose.Types.ObjectId.isValid(v);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.level) filter.level = req.query.level;
  if (req.query.acked !== undefined) filter.acked = req.query.acked === 'true';
  const docs = await Alarm.find(filter).sort('-createdAt').limit(200);
  res.json(docs);
});

router.post('/', async (req, res) => {
  const doc = await Alarm.create(req.body);
  res.status(201).json(doc);
});

router.patch('/:id/ack', allow('ADMIN','ENGINEER','OPERATOR'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  const doc = await Alarm.findByIdAndUpdate(
    req.params.id,
    { acked: true, ackedBy: req.user.name, ackedAt: new Date() },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await Log.create({ type: 'CTRL', msg: `Ack alarm [${doc.code}]: ${doc.msg}`, who: req.user.name });
  res.json(doc);
});

router.delete('/:id', allow('ADMIN','ENGINEER'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  await Alarm.findByIdAndDelete(req.params.id);
  res.json({ id: req.params.id });
});

router.delete('/', allow('ADMIN'), async (req, res) => {
  const { deletedCount } = await Alarm.deleteMany({ acked: true });
  res.json({ message: `Cleared ${deletedCount} acked alarms` });
});

export default router;
