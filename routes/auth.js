import { Router } from 'express';
import bcrypt from 'bcryptjs';
import logger from '../lib/logger.js';
import { createUser, findUserByEmail } from '../lib/store.js';
import { isValidEmail, isValidPassword } from '../lib/validators.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      logger.warn({ requestId: req.id, route: 'register' }, 'Registration rejected: missing fields');
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (!isValidEmail(email)) {
      logger.warn({ requestId: req.id, route: 'register' }, 'Registration rejected: invalid email');
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be 8-128 characters' });
    }
    if (findUserByEmail(email)) {
      logger.warn({ requestId: req.id, route: 'register' }, 'Registration rejected: email already in use');
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({ name: String(name).trim(), email: email.trim(), passwordHash });
    logger.info({ userId: user.id, requestId: req.id }, 'User registered');

    return res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token: signToken(user),
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = findUserByEmail(email);
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!valid) {
      logger.warn({ requestId: req.id, route: 'login' }, 'Failed login attempt');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    logger.info({ userId: user.id, requestId: req.id }, 'User logged in');
    return res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token: signToken(user),
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
