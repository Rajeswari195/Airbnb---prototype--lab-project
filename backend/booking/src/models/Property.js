import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    city: { type: String, required: true },
    capacity: { type: Number, required: true },
    photos: [String],
    amenities: [String],
    createdAt: { type: Date, default: Date.now }
});

const Property = mongoose.model('Property', propertySchema);
export default Property;
