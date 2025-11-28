import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
    traceId: { type: String, required: true },
    userId: { type: String }, // Can be null if not logged in
    eventType: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    payload: { type: mongoose.Schema.Types.Mixed }
});

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
export default AnalyticsEvent;
