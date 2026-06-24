import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  _id:    { type: String, default: 'system' },
  sp:     { type: Number, default: 7.0 },
  db:     { type: Number, default: 0.3 },
  demand: { type: Number, default: 1.8 },
  seqMode:{ type: String, enum: ['AUTO','MANUAL'], default: 'AUTO' },
  pidKp:  { type: Number, default: 0.8  },
  pidKi:  { type: Number, default: 0.12 },
  pidKd:  { type: Number, default: 0.05 },
}, { timestamps: true });

export default mongoose.model('SystemSettings', settingsSchema);
