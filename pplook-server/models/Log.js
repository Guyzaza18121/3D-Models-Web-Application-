import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  type: { type: String, enum: ['SEQ','CTRL','ALARM','AUTH','CFG','SYS'], required: true },
  msg:  { type: String, required: true },
  who:  { type: String, default: 'SYSTEM' },
}, { timestamps: true });

// Auto-delete logs older than 30 days
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('Log', logSchema);
