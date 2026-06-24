import mongoose from 'mongoose';

const alarmSchema = new mongoose.Schema({
  code:    { type: String, required: true },
  msg:     { type: String, required: true },
  level:   { type: String, enum: ['CRITICAL','FAULT','WARNING','INFO'], required: true },
  acked:   { type: Boolean, default: false },
  ackedBy: { type: String, default: null },
  ackedAt: { type: Date,   default: null },
}, { timestamps: true });

export default mongoose.model('Alarm', alarmSchema);
