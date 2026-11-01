import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { resetStore } from '../../lib/store.js';

const user = { name: 'Test User', email: 'test@example.com', password: 'password123' };

describe('API Endpoints', () => {
  beforeEach(() => {
    resetStore();
  });

  it('GET /api/health should return status ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /api/health should include timestamp, uptime and version', async () => {
    const response = await request(app).get('/api/health');
    expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    expect(response.body.uptime).toBeTypeOf('number');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('POST /api/auth/register should reject missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });
    expect(response.status).toBe(400);
  });

  it('POST /api/auth/register should create a user and return a token', async () => {
    const response = await request(app).post('/api/auth/register').send(user);
    expect(response.status).toBe(201);
    expect(response.body.token).toBeTypeOf('string');
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('POST /api/auth/register should reject duplicate emails', async () => {
    await request(app).post('/api/auth/register').send(user);
    const response = await request(app).post('/api/auth/register').send(user);
    expect(response.status).toBe(409);
  });

  it('POST /api/auth/login should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fake@example.com', password: 'wrongpassword' });
    expect(response.status).toBe(401);
  });

  it('POST /api/auth/login should succeed with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(user);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeTypeOf('string');
  });

  it('GET /api/payments should require authentication', async () => {
    const response = await request(app).get('/api/payments');
    expect(response.status).toBe(401);
  });

  it('POST /api/payments should create a payment for an authenticated user', async () => {
    const { body } = await request(app).post('/api/auth/register').send(user);
    const auth = { Authorization: `Bearer ${body.token}` };

    const created = await request(app)
      .post('/api/payments')
      .set(auth)
      .send({ amount: 500, phone: '0712345678', description: 'Lunch' });
    expect(created.status).toBe(201);
    expect(created.body.payment.phone).toBe('254712345678');
    expect(created.body.payment.status).toBe('PENDING');
    expect(created.body.payment.formattedAmount).toBe('KES 500');

    const list = await request(app).get('/api/payments').set(auth);
    expect(list.status).toBe(200);
    expect(list.body.payments).toHaveLength(1);
  });

  it('POST /api/payments should reject an invalid phone number', async () => {
    const { body } = await request(app).post('/api/auth/register').send(user);
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${body.token}`)
      .send({ amount: 100, phone: '12345' });
    expect(response.status).toBe(400);
  });

  it('POST /api/payments should reject a negative amount', async () => {
    const { body } = await request(app).post('/api/auth/register').send(user);
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${body.token}`)
      .send({ amount: -10, phone: '0712345678' });
    expect(response.status).toBe(400);
  });
});
