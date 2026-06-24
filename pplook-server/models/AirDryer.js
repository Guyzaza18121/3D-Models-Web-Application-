import mongoose from 'mongoose';

const airDryerSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  status:  { type: String, enum: ['RUNNING','STANDBY','FAULT'], default: 'RUNNING' },
  temp:    { type: Number, default: 32 },
  maxTemp: { type: Number, default: 45 },
  voltage: { type: Number, default: 380 },
  flow:    { type: Number, default: 2.1 },
  clr:     { type: String, default: '#06B6D4' },
}, { timestamps: true });

export default mongoose.model('AirDryer', airDryerSchema);
