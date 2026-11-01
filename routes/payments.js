import { Router } from 'express';
import logger from '../lib/logger.js';
import { createPayment, listPaymentsForUser } from '../lib/store.js';
import { formatKenyanPhone, isValidAmount, maskPhone } from '../lib/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { formatAmount } from '../utils/helpers.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({ payments: listPaymentsForUser(req.user.id) });
});

router.post('/', (req, res) => {
  const { amount, phone, description } = req.body || {};

  if (!isValidAmount(amount)) {
    logger.warn({ userId: req.user.id, requestId: req.id }, 'Payment rejected: invalid amount');
    return res.status(400).json({ error: 'Amount must be a number between 1 and 150000' });
  }

  const formattedPhone = formatKenyanPhone(phone);
  if (!formattedPhone) {
    logger.warn({ userId: req.user.id, requestId: req.id }, 'Payment rejected: invalid phone number');
    return res.status(400).json({ error: 'Invalid Kenyan phone number' });
  }

  const payment = createPayment({
    userId: req.user.id,
    amount: Number(amount),
    phone: formattedPhone,
    description: typeof description === 'string' ? description.slice(0, 200) : '',
  });

  logger.info(
    { paymentId: payment.id, amount: payment.amount, phone: maskPhone(formattedPhone), userId: req.user.id },
    'Payment created',
  );

  return res.status(201).json({ payment: { ...payment, formattedAmount: formatAmount(payment.amount) } });
});

export default router;
