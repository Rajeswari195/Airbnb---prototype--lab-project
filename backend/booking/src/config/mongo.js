import mongoose from 'mongoose';

// Use env override if present, else default localhost Mongo
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airbnb';

export async function connectMongoBooking() {
    console.log('[Booking Mongo] Connecting to', mongoUri);
    try {
        await mongoose.connect(mongoUri);
        console.log(`✅ Booking service connected to MongoDB at ${mongoUri}`);
    } catch (err) {
        console.error('[Booking Mongo] connection error:', err);
        process.exit(1);
    }
}
