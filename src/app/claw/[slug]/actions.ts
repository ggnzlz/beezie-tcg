'use server';

import { keepItems, purchasePulls, swapItems, validatePromoCode } from '@/data/repository';
import type { PurchaseInput, SwapInput } from '@/types/operations';

export async function purchaseAction(input: PurchaseInput) {
  return purchasePulls(input);
}

export async function swapAction(input: SwapInput) {
  return swapItems(input);
}

export async function keepAction(input: SwapInput) {
  return keepItems(input);
}

export async function checkPromoAction(code: string) {
  return validatePromoCode(code);
}
