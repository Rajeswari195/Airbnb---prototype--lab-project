import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amenities: [String],
    images: [String],
    createdAt: { type: Date, default: Date.now }
});

const Property = mongoose.model('Property', propertySchema);
export default Property;
