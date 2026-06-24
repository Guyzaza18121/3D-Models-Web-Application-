import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const userSchema = new mongoose.Schema({
  un:        { type: String, required: true, unique: true },
  pwHash:    { type: String, required: true },
  name:      { type: String, required: true },
  role:      { type: String, enum: ['ADMIN','ENGINEER','OPERATOR','VIEWER'], default: 'OPERATOR' },
  on:        { type: Boolean, default: true },
  avatar:    { type: String, default: null },
  lastLogin: { type: String, default: null },
}, { timestamps: true });

userSchema.methods.matchPassword = function (pw) {
  return bcrypt.compare(pw, this.pwHash);
};

export default mongoose.model('User', userSchema);
