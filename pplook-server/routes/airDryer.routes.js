import { Router } from 'express';
import mongoose   from 'mongoose';
import AirDryer    from '../models/AirDryer.js';
import Log         from '../models/Log.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const isOid = (v) => mongoose.Types.ObjectId.isValid(v);

router.get('/', async (req, res) => {
  res.json(await AirDryer.find());
});

router.put('/:id', allow('ADMIN','ENGINEER'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  const doc = await AirDryer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

router.patch('/:id/control', allow('ADMIN','ENGINEER','OPERATOR'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  const { action } = req.body;
  if (!['START','STOP'].includes(action))
    return res.status(400).json({ message: 'action must be START | STOP' });

  const status = action === 'START' ? 'RUNNING' : 'STANDBY';
  const doc = await AirDryer.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await Log.create({ type: 'CTRL', msg: `[MANUAL] ${action} ${doc.name}`, who: req.user.name });
  res.json(doc);
});

export default router;
