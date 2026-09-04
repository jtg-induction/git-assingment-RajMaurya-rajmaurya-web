const mongoose = require('mongoose');

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Amount must be greater than zero'],
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    enum: ['USD', 'EUR', 'GBP', 'CAD'],
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
  },
  // Store only last 4 digits — NEVER store full card numbers!
  cardLastFour: {
    type: String,
    required: true,
    match: [/^\d{4}$/, 'cardLastFour must be exactly 4 digits'],
  },
  cardBrand: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'discover'],
  },
  paymentId: {  // External gateway transaction reference
    type: String,
    unique: true,
    sparse: true,
  },
  failureReason: { type: String },
  processedAt: { type: Date },
}, { timestamps: true });

paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ paymentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;

