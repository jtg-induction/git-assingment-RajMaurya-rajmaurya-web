const express = require('express');
const router = express.Router();
const { initiatePayment, getPaymentStatus, refundPayment } = require('../controllers/paymentController');

// POST /api/payments - initiate a payment
router.post('/', initiatePayment);

// GET /api/payments/:id - get payment status
router.get('/:id', getPaymentStatus);

// POST /api/payments/:id/refund - refund a payment
router.post('/:id/refund', refundPayment);

module.exports = router;
