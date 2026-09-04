const paymentService = require('../src/services/paymentService');
const Payment = require('../src/models/payment');

jest.mock('../src/models/payment');

describe('paymentService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('validateAmount()', () => {
    it('should throw 400 for zero amount', () => {
      expect(() => paymentService.validateAmount(0)).toThrow();
    });

    it('should throw 400 for negative amount', () => {
      expect(() => paymentService.validateAmount(-50)).toThrow();
    });

    it('should not throw for valid amount', () => {
      expect(() => paymentService.validateAmount(99.99)).not.toThrow();
    });

    // TODO: test max amount validation
    // TODO: test non-number input
  });

  describe('processPayment()', () => {
    // TODO: mock payment gateway
    // TODO: test successful payment creation
    // TODO: test failed payment handling
    // TODO: test card validation
  });
});
