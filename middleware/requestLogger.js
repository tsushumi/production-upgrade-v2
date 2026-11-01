import { randomUUID } from 'node:crypto';
import logger from '../lib/logger.js';

/**
 * Logs every HTTP request once it completes: method, path, status, duration.
 * 5xx -> error, 4xx -> warn, everything else -> info.
 */
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const entry = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const message = `${req.method} ${req.originalUrl} ${res.statusCode}`;

    if (res.statusCode >= 500) logger.error(entry, message);
    else if (res.statusCode >= 400) logger.warn(entry, message);
    else logger.info(entry, message);
  });

  next();
}

export default requestLogger;
