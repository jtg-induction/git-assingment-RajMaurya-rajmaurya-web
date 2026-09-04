const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const { ORDER_STATUS, ORDER_LIMITS, TAX_CONFIG } = require('../config/constants');

const calculateSubtotal = (items) => {
  return items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
};

const calculateTax = (subtotal, taxRate) => {
  if (!taxRate || taxRate <= 0) return 0;
  return parseFloat((subtotal * (taxRate / 100)).toFixed(2));
};

const getTaxRateForState = (state) => {
  return TAX_CONFIG.RATES_BY_STATE[state?.toUpperCase()] ?? TAX_CONFIG.DEFAULT_RATE_PERCENTAGE;
};

const calculateTotal = (subtotal, taxRate = 0) => {
  const taxAmount = calculateTax(subtotal, taxRate);
  return parseFloat((subtotal + taxAmount).toFixed(2));
};

const validateAndEnrichItems = async (items) => {
  if (!items || items.length === 0) { const err = new Error('Order must contain at least one item.'); err.statusCode = 400; throw err; }
  if (items.length > ORDER_LIMITS.MAX_ITEMS_PER_ORDER) { const err = new Error(`Cannot exceed ${ORDER_LIMITS.MAX_ITEMS_PER_ORDER} items.`); err.statusCode = 400; throw err; }
  const enrichedItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) { const err = new Error(`Product '${item.productId}' not found.`); err.statusCode = 404; throw err; }
    if (!product.isAvailable) { const err = new Error(`'${product.name}' is unavailable.`); err.statusCode = 422; throw err; }
    if (product.stock < item.quantity) { const err = new Error(`Insufficient stock for '${product.name}'.`); err.statusCode = 422; throw err; }
    enrichedItems.push({ product: product._id, quantity: item.quantity, unitPrice: product.price, productName: product.name, productSku: product.sku });
  }
  return enrichedItems;
};

const createOrder = async (userId, orderData) => {
  const { items, shippingAddress, notes } = orderData;
  const enrichedItems = await validateAndEnrichItems(items);
  const subtotal = calculateSubtotal(enrichedItems);
  if (subtotal < ORDER_LIMITS.MIN_ORDER_AMOUNT) { const err = new Error(`Minimum order is $${ORDER_LIMITS.MIN_ORDER_AMOUNT}.`); err.statusCode = 400; throw err; }
  const taxRate = getTaxRateForState(shippingAddress?.state);
  const taxAmount = calculateTax(subtotal, taxRate);
  const totalAmount = calculateTotal(subtotal, taxRate);
  const order = new Order({ user: userId, items: enrichedItems, shippingAddress, subtotal, taxRate, taxAmount, totalAmount, notes, statusHistory: [{ status: ORDER_STATUS.PENDING }] });
  await order.save();
  await Promise.all(enrichedItems.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })));
  await User.findByIdAndUpdate(userId, { $inc: { totalOrders: 1, totalSpend: totalAmount } });
  return order.populate('items.product');
};

/**
 * Get paginated and filtered orders for a user.
 * @param {string} userId
 * @param {Object} options - { page, limit, status, sort, minAmount, maxAmount }
 */
const getOrdersByUser = async (userId, options = {}) => {
  const { page = 1, limit = 20, status, sort = '-createdAt', minAmount, maxAmount } = options;

  const filter = { user: userId };
  if (status) filter.status = status;
  if (minAmount !== undefined || maxAmount !== undefined) {
    filter.totalAmount = {};
    if (minAmount !== undefined) filter.totalAmount.$gte = minAmount;
    if (maxAmount !== undefined) filter.totalAmount.$lte = maxAmount;
  }

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('items.product', 'name sku images').sort(sort).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, total };
};

/**
 * Full-text search across a user's orders (searches product names in items).
 */
const searchOrders = async (userId, options = {}) => {
  const { query, status, page = 1, limit = 20 } = options;

  const filter = {
    user: userId,
    'items.productName': { $regex: query, $options: 'i' },
  };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('items.product', 'name sku images').sort('-createdAt').skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, total };
};

const getOrderById = async (orderId, userId, userRole) => {
  const order = await Order.findById(orderId).populate('items.product');
  if (!order) { const err = new Error('Order not found.'); err.statusCode = 404; throw err; }
  if (userRole !== 'admin' && order.user.toString() !== userId.toString()) { const err = new Error('Not authorized.'); err.statusCode = 403; throw err; }
  return order;
};

const updateOrderStatus = async (orderId, newStatus, adminId, reason) => {
  const validTransitions = { pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: ['refunded'], cancelled: [], refunded: [] };
  const order = await Order.findById(orderId);
  if (!order) { const err = new Error('Order not found.'); err.statusCode = 404; throw err; }
  if (!validTransitions[order.status].includes(newStatus)) { const err = new Error(`Cannot transition from '${order.status}' to '${newStatus}'.`); err.statusCode = 422; throw err; }
  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, changedBy: adminId, reason });
  await order.save();
  return order;
};

const cancelOrder = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order) { const err = new Error('Order not found.'); err.statusCode = 404; throw err; }
  if (order.user.toString() !== userId.toString()) { const err = new Error('Not authorized.'); err.statusCode = 403; throw err; }
  if (order.status !== ORDER_STATUS.PENDING) { const err = new Error('Only pending orders can be cancelled.'); err.statusCode = 422; throw err; }
  order.status = ORDER_STATUS.CANCELLED;
  order.statusHistory.push({ status: ORDER_STATUS.CANCELLED, changedBy: userId, reason: 'Cancelled by customer' });
  await order.save();
  await Promise.all(order.items.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })));
  await User.findByIdAndUpdate(userId, { $inc: { totalOrders: -1, totalSpend: -order.totalAmount } });
  return order;
};

module.exports = { calculateSubtotal, calculateTotal, calculateTax, getTaxRateForState, validateAndEnrichItems, createOrder, getOrdersByUser, searchOrders, getOrderById, updateOrderStatus, cancelOrder };
