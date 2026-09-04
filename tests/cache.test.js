const { CACHE_TTL_SECONDS } = require('../src/config/constants');

describe('Cache Configuration', () => {
  it('should have a short TTL (15s) to prevent stale data', () => {
    expect(CACHE_TTL_SECONDS).toBe(15);
  });
});
