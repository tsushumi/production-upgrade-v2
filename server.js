import './instrument.js'; // must stay first so Sentry can instrument everything below
import app from './app.js';
import logger from './lib/logger.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  logger.fatal('JWT_SECRET is not set; refusing to start');
  process.exit(1);
}

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, nodeEnv: process.env.NODE_ENV }, 'Server started');
});

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
