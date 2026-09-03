// Integer minor units throughout: float cents produce visible rounding
// artefacts in the multi-item batch swap.
export type Currency = 'USD';

export interface Money {
  amount: number;
  currency: Currency;
}

export function money(amount: number, currency: Currency = 'USD'): Money {
  if (!Number.isInteger(amount)) {
    throw new TypeError(`Money must be integer minor units, received ${amount}`);
  }
  return { amount, currency };
}

export function usd(majorUnits: number): Money {
  return money(Math.round(majorUnits * 100));
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new TypeError(`Cannot combine ${a.currency} with ${b.currency}`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount - b.amount, currency: a.currency };
}

export function multiply(a: Money, factor: number): Money {
  return { amount: Math.round(a.amount * factor), currency: a.currency };
}

export function sum(values: readonly Money[], currency: Currency = 'USD'): Money {
  return values.reduce<Money>((total, value) => add(total, value), { amount: 0, currency });
}

export function isZero(value: Money): boolean {
  return value.amount === 0;
}

export function isLessThan(a: Money, b: Money): boolean {
  assertSameCurrency(a, b);
  return a.amount < b.amount;
}

export function percentageOf(value: Money, percent: number): Money {
  return { amount: Math.round(value.amount * (percent / 100)), currency: value.currency };
}

// Locale is pinned: a locale-dependent format renders differently on the server
// and the client and guarantees a hydration mismatch.
const FORMATTERS = new Map<string, Intl.NumberFormat>();

function formatter(currency: Currency, fractionDigits: number): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`;
  let cached = FORMATTERS.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    FORMATTERS.set(key, cached);
  }
  return cached;
}

export interface FormatOptions {
  /** Drop `.00` on whole amounts, matching how the Figma renders prices. */
  compactWholeUnits?: boolean;
}

export function format(value: Money, options: FormatOptions = {}): string {
  const { compactWholeUnits = true } = options;
  const isWhole = value.amount % 100 === 0;
  const digits = compactWholeUnits && isWhole ? 0 : 2;
  return formatter(value.currency, digits).format(value.amount / 100);
}
