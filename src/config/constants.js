// =========================================================
// Application-wide constants for ShopNow Order API
// =========================================================

module.exports = {
  // --- Database ---
  DB_RETRY_LIMIT: 5,
  DB_RETRY_DELAY_MS: 5000,

  // --- Authentication ---
  JWT_EXPIRES_IN: '7d',
  BCRYPT_SALT_ROUNDS: 12,

  // --- Pagination ---
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // --- Order Configuration ---
  ORDER_LIMITS: {
    MAX_ITEMS_PER_ORDER: 50,
    MIN_ORDER_AMOUNT: 1.00,
    MAX_ORDER_AMOUNT: 50000.00,
    CANCELLATION_WINDOW_HOURS: 24,
  },

  // --- Order Statuses ---
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },

  // --- Product Configuration ---
  PRODUCT_CATEGORIES: [
    'electronics', 'clothing', 'books', 'home-garden',
    'sports', 'food-beverage', 'beauty', 'toys',
  ],

  // --- Rate Limiting ---
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
    MAX_REQUESTS: 100,
    MESSAGE: 'Too many requests from this IP. Please try again later.',
  },

    // --- Payment Configuration ---
  PAYMENT_LIMITS: {
    MIN_TRANSACTION_AMOUNT: 0.50,
    MAX_TRANSACTION_AMOUNT: 25000.00,
    MAX_REFUND_DAYS: 30,
    SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD'],
  },

  // --- Cache ---
  CACHE_TTL_SECONDS: 60,
};

