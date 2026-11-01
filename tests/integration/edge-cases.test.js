import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import app from '../../app.js';
import { createRateLimiter } from '../../middleware/rateLimiter.js';
import { requestLogger } from '../../middleware/requestLogger.js';
import logger from '../../lib/logger.js';

describe('Edge Cases', () => {
  it('should handle malformed JSON body gracefully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('not valid json{');
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should handle a missing Content-Type header', async () => {
    const response = await request(app).post('/api/auth/register').send('name=Brian');
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/required/i);
  });

  it('should return 404 for non-existent routes', async () => {
    const response = await request(app).get('/api/nonexistent');
    expect(response.status).toBe(404);
  });

  it('should reject a tampered or garbage bearer token', async () => {
    const response = await request(app)
      .get('/api/payments')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(response.status).toBe(401);
  });

  it('should attach a request id header and echo a supplied one', async () => {
    const generated = await request(app).get('/api/health');
    expect(generated.headers['x-request-id']).toBeTruthy();

    const echoed = await request(app).get('/api/health').set('x-request-id', 'trace-123');
    expect(echoed.headers['x-request-id']).toBe('trace-123');
  });

  it('should not expose the debug Sentry route unless explicitly enabled', async () => {
    const response = await request(app).get('/api/debug-sentry');
    expect(response.status).toBe(404);
  });

  it('should rate limit excessive requests', async () => {
    const limited = express();
    limited.use(createRateLimiter({ max: 3, windowMs: 60_000 }));
    limited.get('/ping', (_req, res) => res.json({ ok: true }));

    const statuses = [];
    for (let i = 0; i < 5; i += 1) {
      statuses.push((await request(limited).get('/ping')).status);
    }
    expect(statuses).toEqual([200, 200, 200, 429, 429]);

    const blocked = await request(limited).get('/ping');
    expect(blocked.body.error).toMatch(/too many requests/i);
  });

  it('should never rate limit the health endpoint', async () => {
    const limited = express();
    limited.use(createRateLimiter({ max: 1, windowMs: 60_000, skip: (req) => req.path === '/health' }));
    limited.get('/health', (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 4; i += 1) {
      const response = await request(limited).get('/health');
      expect(response.status).toBe(200);
    }
  });

  it('should log requests at a level that matches the status code (mocked logger)', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    const logged = express();
    logged.use(requestLogger);
    logged.get('/ok', (_req, res) => res.sendStatus(200));
    logged.get('/bad', (_req, res) => res.sendStatus(400));

    await request(logged).get('/ok');
    await request(logged).get('/bad');

    expect(info).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET', statusCode: 200 }), 'GET /ok 200');
    expect(warn).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }), 'GET /bad 400');
    vi.restoreAllMocks();
  });
});
