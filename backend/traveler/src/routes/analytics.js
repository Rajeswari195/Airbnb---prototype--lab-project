import { Router } from 'express';
import { sendAnalyticsEvent } from '../kafka/producer.js';

const router = Router();

/**
 * POST /api/analytics
 * Receives analytics events from frontend
 */
router.post('/', async (req, res) => {
    try {
        const { eventType, payload } = req.body;
        const userId = req.session?.userId || 'anonymous';
        const traceId = req.headers['x-trace-id'] || 'generated-' + Date.now();

        await sendAnalyticsEvent({
            traceId,
            userId,
            eventType,
            payload
        });

        res.status(202).json({ ok: true });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Failed to process event' });
    }
});

export default router;
