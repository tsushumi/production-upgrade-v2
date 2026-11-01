import rateLimit from 'express-rate-limit';
import logger from '../lib/logger.js';

/**
 * Builds a rate limiter. Exposed as a factory so tests can create one with a
 * tiny limit instead of firing hundreds of requests.
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 100,
  skip,
} = {}) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    handler: (req, res) => {
      logger.warn({ ip: req.ip, url: req.originalUrl, requestId: req.id }, 'Rate limit exceeded');
      res.status(429).json({ error: 'Too many requests, please try again later' });
    },
  });
}

// Default API limiter. The health endpoint is skipped so uptime monitors
// (UptimeRobot pings every few minutes) are never throttled.
export const apiLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  skip: (req) => req.path === '/health',
});
