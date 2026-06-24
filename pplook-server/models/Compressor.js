import mongoose from 'mongoose';

const compressorSchema = new mongoose.Schema({
  brand:       { type: String, required: true },
  model:       { type: String, required: true },
  name:        String,
  type:        { type: String, default: 'Screw' },
  kw:          { type: Number, required: true },
  flow:        { type: Number, required: true },
  maxPressure: { type: Number, default: 10 },
  voltage:     { type: Number, default: 380 },
  clr:         { type: String, default: '#3B82F6' },
  note:        { type: String, default: '' },
  status:      { type: String, enum: ['RUNNING','STANDBY','FAULT'], default: 'STANDBY' },
  load:        { type: Number, default: 0 },
  curr:        { type: Number, default: 0 },
  temp:        { type: Number, default: 35 },
  press:       { type: Number, default: 0 },
  seq:         { type: Number, required: true },
  lead:        { type: Boolean, default: false },
  hrs:         { type: Number, default: 0 },
  fault:       { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Compressor', compressorSchema);
