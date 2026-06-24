import { Router }   from 'express';
import SystemSettings from '../models/SystemSettings.js';
import Log            from '../models/Log.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res) => {
  let doc = await SystemSettings.findById('system');
  if (!doc) doc = await SystemSettings.create({ _id: 'system' });
  res.json(doc);
});

router.put('/', allow('ADMIN','ENGINEER'), async (req, res) => {
  const doc = await SystemSettings.findByIdAndUpdate('system', req.body, { new: true, upsert: true });
  await Log.create({ type: 'CFG', msg: 'System settings updated', who: req.user.name });
  res.json(doc);
});

router.patch('/', allow('ADMIN','ENGINEER'), async (req, res) => {
  const doc = await SystemSettings.findByIdAndUpdate('system', { $set: req.body }, { new: true, upsert: true });
  res.json(doc);
});

export default router;
