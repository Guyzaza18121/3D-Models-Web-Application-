import mongoose from 'mongoose';

const sensorSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  type:     { type: String, required: true },
  location: { type: String, default: '' },
  unit:     { type: String, default: '' },
  value:    { type: Number, default: 0 },
  min:      { type: Number, default: 0 },
  max:      { type: Number, default: 100 },
  ok:       { type: Boolean, default: true },
  clr:      { type: String, default: '#3B82F6' },
}, { timestamps: true });

export default mongoose.model('Sensor', sensorSchema);
