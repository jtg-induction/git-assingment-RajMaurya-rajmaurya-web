const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
  },
  productName: { type: String, required: true },
  productSku: { type: String, required: true },
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'US' },
  phone: { type: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  items: {
    type: [orderItemSchema],
    validate: [(arr) => arr.length > 0, 'Order must have at least one item'],
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: [true, 'Shipping address is required'],
  },
  subtotal: { type: Number, required: true, min: 0 },

  // --- Tax fields (added by main - tax calculation feature) ---
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [50, 'Tax rate seems unreasonably high'],
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative'],
  },
  taxExempt: { type: Boolean, default: false },
  // --- Discount fields (added by feature/rebase-me) ---
  discountCode: {
    type: String,
    uppercase: true,
    trim: true,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative'],
  },
  discountDescription: { type: String },

  shippingCost: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  notes: { type: String, maxlength: [500, 'Notes cannot exceed 500 characters'] },
  statusHistory: [{
    status: { type: String, enum: Object.values(ORDER_STATUS) },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
  }],
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

orderSchema.index({ user: 1, status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ discountCode: 1 });

module.exports = mongoose.model('Order', orderSchema);
