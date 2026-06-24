import { Router }    from 'express';
import mongoose       from 'mongoose';
import Compressor     from '../models/Compressor.js';
import Log            from '../models/Log.js';
import { protect, allow } from '../middleware/auth.js';
import { publishCommand } from '../mqtt.js';

const router = Router();
router.use(protect);

const isOid = (v) => mongoose.Types.ObjectId.isValid(v);

router.get('/', async (req, res) => {
  const docs = await Compressor.find().sort('seq');
  res.json(docs);
});

router.post('/', allow('ADMIN','ENGINEER'), async (req, res) => {
  const count = await Compressor.countDocuments();
  const doc   = await Compressor.create({ ...req.body, seq: count + 1 });
  await Log.create({ type: 'CFG', msg: `เพิ่มปั้มลม: ${doc.brand} ${doc.model} ${doc.kw}kW`, who: req.user.name });
  res.status(201).json(doc);
});

router.put('/:id', allow('ADMIN','ENGINEER'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  const doc = await Compressor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await Log.create({ type: 'CFG', msg: `แก้ไขสเปค: ${doc.brand} ${doc.model}`, who: req.user.name });
  res.json(doc);
});

router.delete('/:id', allow('ADMIN','ENGINEER'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  const doc = await Compressor.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await Compressor.updateMany({ seq: { $gt: doc.seq } }, { $inc: { seq: -1 } });
  await Log.create({ type: 'CFG', msg: `ลบปั้มลม: ${doc.brand} ${doc.model}`, who: req.user.name });
  res.json({ id: req.params.id });
});

router.patch('/:id/control', allow('ADMIN','ENGINEER','OPERATOR'), async (req, res) => {
  if (!isOid(req.params.id)) return res.status(400).json({ message: 'Invalid id format' });
  const { action } = req.body;
  if (!['START','STOP','RESET'].includes(action))
    return res.status(400).json({ message: 'action must be START | STOP | RESET' });

  const doc = await Compressor.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const mqttOk = publishCommand(`compressor/${req.params.id}`, { action, ts: Date.now() });

  if (!mqttOk) {
    const update = action === 'START'
      ? { status: 'RUNNING', fault: '' }
      : { status: 'STANDBY', load: 0, curr: 0, fault: '' };
    await Compressor.findByIdAndUpdate(req.params.id, update);
  }

  await Log.create({ type: 'CTRL', msg: `[MANUAL] ${action} C-${String(doc.seq).padStart(2,'0')} ${doc.brand} ${doc.model}`, who: req.user.name });
  res.json({ id: req.params.id, action, forwarded: mqttOk });
});

export default router;
