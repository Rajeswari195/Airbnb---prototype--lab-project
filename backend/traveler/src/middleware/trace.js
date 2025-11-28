import { v4 as uuidv4 } from 'uuid';

export default function traceMiddleware(req, res, next) {
    const traceId = req.headers['x-trace-id'] || uuidv4();
    req.traceId = traceId;
    res.setHeader('x-trace-id', traceId);
    next();
}
