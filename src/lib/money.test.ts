import { describe, expect, it } from 'vitest';

import {
  add,
  format,
  isLessThan,
  money,
  multiply,
  percentageOf,
  subtract,
  sum,
  usd,
} from './money';

describe('money', () => {
  it('rejects fractional minor units', () => {
    expect(() => money(10.5)).toThrow(TypeError);
  });

  it('converts major units without float drift', () => {
    expect(usd(0.1).amount).toBe(10);
    expect(usd(4200).amount).toBe(420_000);
    expect(usd(142.35).amount).toBe(14_235);
  });

  it('adds and subtracts', () => {
    expect(add(usd(500), usd(30)).amount).toBe(53_000);
    expect(subtract(usd(500), usd(30)).amount).toBe(47_000);
  });

  it('multiplies by a quantity', () => {
    expect(multiply(usd(500), 5).amount).toBe(250_000);
  });

  it('sums twelve values exactly', () => {
    const values = Array.from({ length: 12 }, () => usd(0.1));
    expect(sum(values).amount).toBe(120);
    // The same arithmetic in floats does not land on 1.2.
    expect(sum(values).amount / 100).toBe(1.2);
  });

  it('sums a mixed multi-item swap selection', () => {
    const selection = [usd(5000), usd(3500), usd(1250.5), usd(99.99)];
    expect(sum(selection).amount).toBe(985_049);
    expect(format(sum(selection))).toBe('$9,850.49');
  });

  it('rounds percentages to the nearest cent', () => {
    expect(percentageOf(usd(99.99), 10).amount).toBe(1000);
    expect(percentageOf(usd(0.05), 50).amount).toBe(3);
  });

  it('compares amounts', () => {
    expect(isLessThan(usd(10), usd(20))).toBe(true);
    expect(isLessThan(usd(20), usd(10))).toBe(false);
  });

  it('formats whole amounts without decimals and partials with them', () => {
    expect(format(usd(14_200))).toBe('$14,200');
    expect(format(usd(4200))).toBe('$4,200');
    expect(format(usd(30))).toBe('$30');
    expect(format(usd(1250.5))).toBe('$1,250.50');
    expect(format(usd(14_200), { compactWholeUnits: false })).toBe('$14,200.00');
  });

  it('refuses to mix currencies', () => {
    expect(() => add(usd(1), { amount: 100, currency: 'EUR' as 'USD' })).toThrow(TypeError);
  });
});
