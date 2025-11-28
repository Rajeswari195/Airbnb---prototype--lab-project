import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true }, // Match MongoDB ObjectId
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    guests: { type: Number, required: true },
    totalPrice: { type: Number },
    status: { type: String, enum: ['Pending', 'Accepted', 'Cancelled'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
}, { _id: false }); // Disable auto-generation of _id

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
