import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import * as Sentry from '@sentry/node';
import logger from './lib/logger.js';
import requestLogger from './middleware/requestLogger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payments.js';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
app.use(requestLogger);
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime() * 100) / 100,
    version,
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

// Temporary: verifies Sentry end to end. Disabled unless ENABLE_SENTRY_DEBUG=true.
// Delete this route once the error shows up in your Sentry dashboard.
if (process.env.ENABLE_SENTRY_DEBUG === 'true') {
  app.get('/api/debug-sentry', () => {
    throw new Error('Sentry backend test error');
  });
}

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Sentry's error handler must come after all routes and before other error handlers.
Sentry.setupExpressErrorHandler(app);

app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error({ err, requestId: req.id, url: req.originalUrl }, 'Unhandled error');
    return res.status(500).json({ error: 'Internal server error' });
  }

  // Client errors such as malformed JSON bodies.
  logger.warn({ requestId: req.id, reason: err.message }, 'Bad request');
  return res.status(status).json({ error: status === 400 ? 'Malformed request body' : err.message });
});

export default app;
