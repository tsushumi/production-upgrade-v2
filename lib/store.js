// Simple in-memory data store.
//
// It keeps the test suite fast and independent of any database, so CI is
// deterministic. Swap these functions for Prisma calls when you wire up
// PostgreSQL: the routes only depend on this module's interface.
import { randomUUID } from 'node:crypto';

const users = new Map();
const payments = new Map();

export function createUser({ name, email, passwordHash }) {
  const user = {
    id: randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);
  return user;
}

export function findUserByEmail(email) {
  const target = String(email).toLowerCase();
  for (const user of users.values()) {
    if (user.email === target) return user;
  }
  return null;
}

export function createPayment({ userId, amount, phone, description }) {
  const payment = {
    id: randomUUID(),
    userId,
    amount,
    phone,
    description: description || '',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  payments.set(payment.id, payment);
  return payment;
}

export function listPaymentsForUser(userId) {
  return [...payments.values()].filter((p) => p.userId === userId);
}

export function resetStore() {
  users.clear();
  payments.clear();
}
