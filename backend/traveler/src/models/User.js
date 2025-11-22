import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['traveler', 'owner'], required: true },
    name: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  {
    collection: 'users' 
  }
);

const User = mongoose.model('User', userSchema);
export default User;
