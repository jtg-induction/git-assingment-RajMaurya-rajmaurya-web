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
    INCLUDE_TAX_IN_MINIMUM: false,
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


  // --- Tax Configuration ---
  TAX_CONFIG: {
    DEFAULT_RATE_PERCENTAGE: 8.5,
    RATES_BY_STATE: {
      CA: 10.25,
      NY: 8.875,
      TX: 8.25,
      FL: 7.00,
      WA: 10.50,
      OR: 0.00,
      MT: 0.00,
    },
    TAX_EXEMPT_CATEGORIES: ['food-beverage'],
  },

  // --- Security (PATCH: 2024-01-15 - CVE-2024-SHOPNOW-001) ---
  SECURITY: {
    JWT_ISSUER: 'shopnow-api',
    JWT_ALGORITHM: 'HS256',
    AUTH_RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000,   // 15 minutes
      MAX_ATTEMPTS: 10,              // 10 login/register attempts per window
    },
    PASSWORD_MIN_LENGTH: 8,
    ALLOWED_ORIGINS: ['https://shopnow.com', 'https://admin.shopnow.com'],
  },
  // --- Rate Limiting ---
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
    MAX_REQUESTS: 100,
    MESSAGE: 'Too many requests from this IP. Please try again later.',
  },

  // --- Cache ---
  CACHE_TTL_SECONDS: 60,
};


