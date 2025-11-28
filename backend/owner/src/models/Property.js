import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    city: { type: String },
    address: { type: String },
    price: { type: Number, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amenities: [String],
    images: [String],
    photos: [String],
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    capacity: { type: Number },
    type: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Property = mongoose.model('Property', propertySchema);
export default Property;
