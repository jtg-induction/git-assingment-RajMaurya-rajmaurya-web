const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const { ORDER_STATUS, ORDER_LIMITS, TAX_CONFIG, DISCOUNT_CONFIG } = require('../config/constants');

/**
 * Calculate the subtotal for a list of order items.
 */
const calculateSubtotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.unitPrice * item.quantity);
  }, 0);
};

/**
 * Calculate the tax amount for a given subtotal and tax rate.
 * @param {number} subtotal
 * @param {number} taxRate - tax percentage (e.g., 8.5 for 8.5%)
 * @returns {number} tax amount
 */
const calculateTax = (subtotal, taxRate) => {
  if (!taxRate || taxRate <= 0) return 0;
  return parseFloat((subtotal * (taxRate / 100)).toFixed(2));
};

/**
 * Get the applicable tax rate for a shipping address state.
 */
const getTaxRateForState = (state) => {
  return TAX_CONFIG.RATES_BY_STATE[state?.toUpperCase()] ?? TAX_CONFIG.DEFAULT_RATE_PERCENTAGE;
};

/**
 * Calculate the grand total including tax.
 * @param {number} subtotal
 * @param {number} taxRate - tax percentage (default: 0)
 * @returns {number} total amount due
 */
const calculateTotal = (subtotal, taxRate = 0, discountAmount = 0) => {
  const taxAmount = calculateTax(subtotal, taxRate);
  const discounted = subtotal - discountAmount;
  return parseFloat((discounted + taxAmount).toFixed(2));};
 /* Calculate the grand total, applying a discount to the subtotal.
 * @param {number} subtotal
 * @param {number} discountAmount - flat amount to subtract (default: 0)
 * @returns {number} total amount due (never goes below 0)
 */


/*
 * Look up and apply a discount code to a subtotal.
 * Returns the discount amount and a description.
 * @param {number} subtotal
 * @param {string} discountCode
 * @returns {{ discountAmount: number, discountDescription: string, valid: boolean }}
 */
const applyDiscount = (subtotal, discountCode) => {
  if (!discountCode) {
    return { discountAmount: 0, discountDescription: null, valid: false };
  }

  const code = DISCOUNT_CONFIG.CODES[discountCode.toUpperCase()];
  if (!code) {
    return { discountAmount: 0, discountDescription: null, valid: false };
  }

  if (subtotal < DISCOUNT_CONFIG.MIN_ORDER_FOR_DISCOUNT) {
    const err = new Error(`Discount codes require a minimum order of $${DISCOUNT_CONFIG.MIN_ORDER_FOR_DISCOUNT}.`);
    err.statusCode = 400;
    throw err;
  }

  let discountAmount = 0;
  if (code.type === 'percentage') {
    discountAmount = parseFloat((subtotal * (code.value / 100)).toFixed(2));
    const maxDiscount = subtotal * (DISCOUNT_CONFIG.MAX_DISCOUNT_PERCENTAGE / 100);
    discountAmount = Math.min(discountAmount, maxDiscount);
  } else if (code.type === 'fixed') {
    discountAmount = Math.min(code.value, subtotal);
  }

  return { discountAmount, discountDescription: code.description, valid: true };
};

/**
 * Validate order items against inventory and return enriched item list.
 */
const validateAndEnrichItems = async (items) => {
  if (!items || items.length === 0) {
    const err = new Error('Order must contain at least one item.');
    err.statusCode = 400;
    throw err;
  }
  if (items.length > ORDER_LIMITS.MAX_ITEMS_PER_ORDER) {
    const err = new Error(`Cannot exceed ${ORDER_LIMITS.MAX_ITEMS_PER_ORDER} items per order.`);
    err.statusCode = 400;
    throw err;
  }

  const enrichedItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) { const err = new Error(`Product '${item.productId}' not found.`); err.statusCode = 404; throw err; }
    if (!product.isAvailable) { const err = new Error(`'${product.name}' is unavailable.`); err.statusCode = 422; throw err; }
    if (product.stock < item.quantity) { const err = new Error(`Insufficient stock for '${product.name}'.`); err.statusCode = 422; throw err; }

    enrichedItems.push({
      product: product._id,
      quantity: item.quantity,
      unitPrice: product.price,
      productName: product.name,
      productSku: product.sku,
    });
  }
  return enrichedItems;
};

/**
 * Create a new order, calculating applicable tax based on shipping state.
 * Create a new order, applying an optional discount code.
 */
const createOrder = async (userId, orderData) => {
  const { items, shippingAddress, notes, discountCode } = orderData;

  const enrichedItems = await validateAndEnrichItems(items);
  const subtotal = calculateSubtotal(enrichedItems);

  if (subtotal < ORDER_LIMITS.MIN_ORDER_AMOUNT) { const err = new Error(`Minimum order is $${ORDER_LIMITS.MIN_ORDER_AMOUNT}.`); err.statusCode = 400; throw err; }
  if (subtotal > ORDER_LIMITS.MAX_ORDER_AMOUNT) { const err = new Error(`Maximum order is $${ORDER_LIMITS.MAX_ORDER_AMOUNT}.`); err.statusCode = 400; throw err; }

  // Calculate tax based on shipping state
  const taxRate = getTaxRateForState(shippingAddress?.state);
  const taxAmount = calculateTax(subtotal, taxRate);
  // Apply discount code if provided
  const { discountAmount, discountDescription, valid } = applyDiscount(subtotal, discountCode);
  const totalAmount = calculateTotal(subtotal, taxRate, discountAmount);

  const order = new Order({
    user: userId,
    items: enrichedItems,
    shippingAddress,
    subtotal,
    taxRate,
    taxAmount,
    discountCode: valid ? discountCode.toUpperCase() : undefined,
    discountAmount,
    discountDescription,
    totalAmount,
    notes,
    statusHistory: [{ status: ORDER_STATUS.PENDING }],
  });

  await order.save();

  await Promise.all(enrichedItems.map((item) =>
    Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
  ));

  await User.findByIdAndUpdate(userId, { $inc: { totalOrders: 1, totalSpend: totalAmount } });

  return order.populate('items.product');
};

const getOrdersByUser = async (userId) => {
  return Order.find({ user: userId }).populate('items.product', 'name sku images').sort({ createdAt: -1 });
};

const getOrderById = async (orderId, userId, userRole) => {
  const order = await Order.findById(orderId).populate('items.product');
  if (!order) { const err = new Error('Order not found.'); err.statusCode = 404; throw err; }
  if (userRole !== 'admin' && order.user.toString() !== userId.toString()) { const err = new Error('Not authorized.'); err.statusCode = 403; throw err; }
  return order;
};

const updateOrderStatus = async (orderId, newStatus, adminId, reason) => {
  const validTransitions = {
    pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'], shipped: ['delivered'],
    delivered: ['refunded'], cancelled: [], refunded: [],
  };
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

module.exports = {
  calculateSubtotal, calculateTotal, calculateTax, getTaxRateForState,
  calculateSubtotal, calculateTotal, applyDiscount,
  validateAndEnrichItems, createOrder, getOrdersByUser,
  getOrderById, updateOrderStatus, cancelOrder,
};
