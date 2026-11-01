import pino from 'pino';

const env = process.env.NODE_ENV || 'development';

function resolveLevel() {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  if (env === 'test') return 'silent';
  return env === 'production' ? 'info' : 'debug';
}

const options = {
  level: resolveLevel(),
  base: { service: 'production-upgrade-api', env },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Never write secrets or credentials into logs.
  redact: {
    paths: [
      'req.headers.authorization',
      'headers.authorization',
      'password',
      '*.password',
      'token',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
};

// Human-readable output in development only. Production emits JSON lines,
// which is what Render's log viewer and log search work best with.
if (env === 'development') {
  options.transport = {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service,env' },
  };
}

const logger = pino(options);

export default logger;
