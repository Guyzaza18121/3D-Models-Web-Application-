import { Router } from 'express';
import Log         from '../models/Log.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.type && req.query.type !== 'ALL') filter.type = req.query.type;
  if (req.query.who)    filter.who = new RegExp(req.query.who, 'i');
  if (req.query.search) filter.msg = new RegExp(req.query.search, 'i');
  const docs = await Log.find(filter).sort('-createdAt').limit(parseInt(req.query.limit) || 400);
  res.json(docs);
});

router.post('/', async (req, res) => {
  const doc = await Log.create(req.body);
  res.status(201).json(doc);
});

router.delete('/', allow('ADMIN'), async (req, res) => {
  const { deletedCount } = await Log.deleteMany({});
  res.json({ message: `Cleared ${deletedCount} logs` });
});

export default router;
