// backend/traveler/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['traveler', 'owner'], required: true },

    // Existing basic field
    name: { type: String },

    // 🔹 New profile fields for Lab 2 (Profile page)
    phone: { type: String },
    about: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    languages: { type: [String], default: [] },
    gender: { type: String },
    avatarUrl: { type: String },

    createdAt: { type: Date, default: Date.now }
  },
  {
    collection: 'users'
  }
);

const User = mongoose.model('User', userSchema);
export default User;
