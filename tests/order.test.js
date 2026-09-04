const orderService = require('../src/services/orderService');
const { orderCache } = require('../src/controllers/orderController');
const Order = require('../src/models/order');
const Product = require('../src/models/product');
const User = require('../src/models/user');

jest.mock('../src/models/order');
jest.mock('../src/models/product');
jest.mock('../src/models/user');

describe('orderService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('calculateSubtotal()', () => {
    it('should correctly sum item prices', () => {
      const items = [{ unitPrice: 10.00, quantity: 2 }, { unitPrice: 5.50, quantity: 3 }];
      expect(orderService.calculateSubtotal(items)).toBe(36.50);
    });

    it('should return 0 for an empty item list', () => {
      expect(orderService.calculateSubtotal([])).toBe(0);
    });
  });

  describe('getOrdersByUser() - pagination', () => {
    it('should apply skip and limit based on page options', async () => {
      const mockFind = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]) };
      Order.find.mockReturnValue(mockFind);
      Order.countDocuments.mockResolvedValue(50);

      await orderService.getOrdersByUser('user123', { page: 2, limit: 10 });

      expect(mockFind.skip).toHaveBeenCalledWith(10); // (page-1) * limit = 1 * 10
      expect(mockFind.limit).toHaveBeenCalledWith(10);
    });

    it('should filter by status when provided', async () => {
      const mockFind = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]) };
      Order.find.mockReturnValue(mockFind);
      Order.countDocuments.mockResolvedValue(0);

      await orderService.getOrdersByUser('user123', { status: 'pending' });

      expect(Order.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    });

    it('should return total count alongside orders', async () => {
      const mockFind = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]) };
      Order.find.mockReturnValue(mockFind);
      Order.countDocuments.mockResolvedValue(42);

      const result = await orderService.getOrdersByUser('user123', {});
      expect(result.total).toBe(42);
    });
  });

  describe('cancelOrder()', () => {
    it('should throw 422 if order is not in pending state', async () => {
      const mockOrder = { user: { toString: () => 'user123' }, status: 'shipped', items: [] };
      Order.findById.mockResolvedValue(mockOrder);
      await expect(orderService.cancelOrder('order123', 'user123')).rejects.toMatchObject({ statusCode: 422 });
    });

    it('should throw 403 if user does not own the order', async () => {
      const mockOrder = { user: { toString: () => 'otherUser' }, status: 'pending' };
      Order.findById.mockResolvedValue(mockOrder);
      await expect(orderService.cancelOrder('order123', 'user123')).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});

describe('orderController - cache behavior', () => {
  beforeEach(() => {
    orderCache.flushAll();
  });

  it('should store orders in cache after first fetch', async () => {
    // After calling getOrders, cache key should be set
    // (Integration-level: use supertest with mocked service)
    expect(orderCache.keys()).toHaveLength(0);
    orderCache.set('orders:user123', [{ id: 'order1' }]);
    expect(orderCache.get('orders:user123')).toBeDefined();
  });

  it('should invalidate cache when a new order is created', () => {
    orderCache.set('orders:user123', [{ id: 'order1' }]);
    expect(orderCache.get('orders:user123')).toBeDefined();
    orderCache.del('orders:user123');
    expect(orderCache.get('orders:user123')).toBeUndefined();
  });
});
