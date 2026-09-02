const paymentService = require('../services/paymentService');

/**
 * POST /api/payments
 * Initiate a payment for an order.
 */
const initiatePayment = async (req, res, next) => {
  try {    const paymentData = { ...req.body, userId: req.user.id };
    const payment = await paymentService.processPayment(paymentData);
    res.status(201).json({ success: true, message: 'Payment initiated.', data: payment });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/:id
 * Get payment status by payment ID.
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    // TODO: implement getPaymentById in service
    res.status(501).json({ success: false, message: 'Not yet implemented.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payments/:id/refund
 * Initiate a refund for a completed payment.
 */
const refundPayment = async (req, res, next) => {
  try {
    // TODO: implement refund logic
    res.status(501).json({ success: false, message: 'Refunds not yet implemented.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { initiatePayment, getPaymentStatus, refundPayment };

