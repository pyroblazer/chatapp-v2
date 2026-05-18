import { formatBadgeCount } from '../helpers';

describe('formatBadgeCount', () => {
  it('should return empty string for 0', () => {
    expect(formatBadgeCount(0)).toBe('');
  });

  it('should return empty string for negative values', () => {
    expect(formatBadgeCount(-1)).toBe('');
    expect(formatBadgeCount(-100)).toBe('');
  });

  it('should return string representation for 1-99', () => {
    expect(formatBadgeCount(1)).toBe('1');
    expect(formatBadgeCount(5)).toBe('5');
    expect(formatBadgeCount(10)).toBe('10');
    expect(formatBadgeCount(50)).toBe('50');
    expect(formatBadgeCount(99)).toBe('99');
  });

  it('should return "99+" for values > 99', () => {
    expect(formatBadgeCount(100)).toBe('99+');
    expect(formatBadgeCount(150)).toBe('99+');
    expect(formatBadgeCount(999)).toBe('99+');
    expect(formatBadgeCount(1000)).toBe('99+');
  });
});
