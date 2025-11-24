// backend/owner/src/config/mongo.js
import mongoose from 'mongoose';

export const mongoUri =
  process.env.MONGODB_URI ||  // preferred (we set this in k8s)
  process.env.MONGO_URI ||
  process.env.MONGO_URL ||
  'mongodb://mongo:27017/airbnb'; // cluster default

export const connectMongoOwner = async () => {
  try {
    console.log('[Owner Mongo] Connecting to', mongoUri);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Owner service connected to MongoDB at', mongoUri);
  } catch (err) {
    console.error('[Owner Mongo] connection error:', err);
  }
};
