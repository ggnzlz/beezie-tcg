import type { Money } from '@/lib/money';

import type { PaymentMethodKind, PullResult } from './catalogue';

export type OperationErrorCode =
  | 'machine-not-found'
  | 'quantity-out-of-bounds'
  | 'insufficient-funds'
  | 'out-of-stock'
  | 'offer-expired'
  | 'already-swapped'
  | 'promo-invalid'
  | 'unavailable';

export interface OperationError {
  ok: false;
  code: OperationErrorCode;
  message: string;
  /** Set when the failure belongs to a specific form field. */
  field?: 'quantity' | 'promoCode' | 'paymentMethod';
}

export interface OperationSuccess<T> {
  ok: true;
  data: T;
}

export type Result<T> = OperationSuccess<T> | OperationError;

export function ok<T>(data: T): OperationSuccess<T> {
  return { ok: true, data };
}

export function fail(
  code: OperationErrorCode,
  message: string,
  field?: OperationError['field'],
): OperationError {
  return { ok: false, code, message, ...(field ? { field } : {}) };
}

export interface PurchaseInput {
  machineSlug: string;
  quantity: number;
  paymentMethodId: string;
  promoCode?: string;
  /** Forces a reproducible outcome; used by the demo seed query parameter. */
  seed?: number;
}

export interface PurchaseSuccess {
  result: PullResult;
  charged: Money;
  discount: Money;
  pointsAwarded: number;
  walletBalance?: Money;
}

export interface SwapInput {
  pullResultId: string;
  pulledItemIds: string[];
}

export interface SwapSuccess {
  credited: Money;
  walletBalance: Money;
  swappedItemIds: string[];
}

export interface KeepInput {
  pullResultId: string;
  pulledItemIds: string[];
}

export interface PriceQuote {
  unitPrice: Money;
  quantity: number;
  subtotal: Money;
  discount: Money;
  total: Money;
  pointsAwarded: number;
}

export interface PaymentMethodView {
  id: string;
  kind: PaymentMethodKind;
  label: string;
  balance?: Money;
  note?: string;
}
