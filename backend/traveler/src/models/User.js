import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: false },
  name: { type: String, required: false },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['traveler', 'owner'], default: 'traveler' },
  phone: { type: String, required: false },
  about: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  country: { type: String, required: false },
  languages: { type: [String], default: [] },
  gender: { type: String, required: false },
  avatarUrl: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  console.log('>>> [User Model] Hashing password for user:', this.email);
  this.password = await bcrypt.hash(this.password, 10);
  console.log('>>> [User Model] Password hashed successfully');
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
