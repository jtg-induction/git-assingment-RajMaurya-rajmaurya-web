const Payment = require('../models/payment');
const { PAYMENT_LIMITS } = require('../config/constants');

/**
 * Validate that a payment amount is within acceptable bounds.
 */
const validateAmount = (amount) => {
  if (!amount || typeof amount !== 'number') {
    const err = new Error('Payment amount must be a valid number.');
    err.statusCode = 400;
    throw err;
  }
  if (amount <= 0) {
    const err = new Error('Payment amount must be greater than zero.');
    err.statusCode = 400;
    throw err;
  }
  if (amount > PAYMENT_LIMITS.MAX_TRANSACTION_AMOUNT) {
    const err = new Error(`Payment amount cannot exceed $${PAYMENT_LIMITS.MAX_TRANSACTION_AMOUNT}.`);
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Validate basic card number format (16 digits for Visa/MC, 15 for Amex).
 * NOTE: This is basic format validation only — real validation happens at the gateway.
 */
const validateCardNumber = (cardNumber) => {
  const cleaned = String(cardNumber).replace(/\s|-/g, '');
  if (!/^\d{15,16}$/.test(cleaned)) {
    const err = new Error('Card number must be 15 or 16 digits.');
    err.statusCode = 400;
    throw err;
  }
  return cleaned;
};

/**
 * Detect card brand from card number prefix.
 */
const detectCardBrand = (cardNumber) => {
  if (/^4/.test(cardNumber)) return 'visa';
  if (/^5[1-5]/.test(cardNumber)) return 'mastercard';
  if (/^3[47]/.test(cardNumber)) return 'amex';
  if (/^6(?:011|5)/.test(cardNumber)) return 'discover';
  return null;
};

/**
 * Process a payment for an order.
 */
// TODO: integrate with real payment gateway (Stripe)
// TODO: add card tokenization

/**
 * Process a payment for an order.
 * @param {Object} paymentData - { orderId, amount, cardNumber, expiryMonth, expiryYear, cvv }
 */
const processPayment = async (paymentData) => {
  const { orderId, userId, amount, cardNumber, expiryMonth, expiryYear, cvv } = paymentData;

  validateAmount(amount);
  const cleanedCard = validateCardNumber(cardNumber);
  const cardLastFour = cleanedCard.slice(-4);
  const cardBrand = detectCardBrand(cleanedCard);
  
  const payment = new Payment({
    order: orderId,
    user: userId,
    amount,
    cardLastFour,
    cardBrand,
    status: 'pending',
  });

  await payment.save();
  return payment;
};

module.exports = { processPayment, validateAmount, validateCardNumber, detectCardBrand };

