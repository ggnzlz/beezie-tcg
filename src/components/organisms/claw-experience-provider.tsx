'use client';

import { createContext, useCallback, useContext, useMemo, useReducer, useState } from 'react';

import { purchaseAction } from '@/app/claw/[slug]/actions';
import { initialState, reduce, type ExperienceState } from '@/lib/experience-machine';
import { multiply, percentageOf, subtract, usd, type Money } from '@/lib/money';
import type { Machine, PaymentMethod, PromoCode } from '@/types/catalogue';
import type { PriceQuote } from '@/types/operations';

interface ClawExperienceValue extends ExperienceState {
  machine: Machine;
  paymentMethods: PaymentMethod[];
  appliedPromo: PromoCode | null;
  quote: PriceQuote;
  setQuantity: (quantity: number) => void;
  applyPromo: (promo: PromoCode | null) => void;
  selectMethod: (id: string) => void;
  openReview: () => void;
  closeReview: () => void;
  confirm: () => void;
  finishReveal: () => void;
  dismissResult: () => void;
  reset: () => void;
}

const ClawExperienceContext = createContext<ClawExperienceValue | null>(null);

export function useClawExperience(): ClawExperienceValue {
  const value = useContext(ClawExperienceContext);
  if (!value) {
    throw new Error('useClawExperience must be used inside ClawExperienceProvider');
  }
  return value;
}

function computeQuote(machine: Machine, quantity: number, promo: PromoCode | null): PriceQuote {
  const subtotal = multiply(machine.unitPrice, quantity);

  let discount: Money = usd(0);
  if (promo) {
    discount =
      promo.discount.kind === 'percentage'
        ? percentageOf(subtotal, promo.discount.percent)
        : promo.discount.amount;
    if (discount.amount > subtotal.amount) discount = subtotal;
  }

  return {
    unitPrice: machine.unitPrice,
    quantity,
    subtotal,
    discount,
    total: subtract(subtotal, discount),
    pointsAwarded: machine.pointsPerPull * quantity,
  };
}

/** Preselect the first method that can actually cover the order. */
function defaultMethodId(methods: PaymentMethod[], total: Money): string | null {
  const affordable = methods.find(
    (method) => !method.balance || method.balance.amount >= total.amount,
  );
  return (affordable ?? methods[0])?.id ?? null;
}

interface ProviderProps {
  machine: Machine;
  paymentMethods: PaymentMethod[];
  /** Forces a reproducible outcome for demos; comes from the `seed` query param. */
  seed?: number;
  children: React.ReactNode;
}

export function ClawExperienceProvider({ machine, paymentMethods, seed, children }: ProviderProps) {
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [state, dispatch] = useReducer(
    reduce,
    initialState({
      paymentMethodId: defaultMethodId(paymentMethods, machine.unitPrice),
    }),
  );

  const quote = useMemo(
    () => computeQuote(machine, state.quantity, appliedPromo),
    [machine, state.quantity, appliedPromo],
  );

  const confirm = useCallback(() => {
    if (state.phase !== 'reviewing' || !state.paymentMethodId) return;
    dispatch({ type: 'CONFIRM' });

    void purchaseAction({
      machineSlug: machine.slug,
      quantity: state.quantity,
      paymentMethodId: state.paymentMethodId,
      ...(appliedPromo ? { promoCode: appliedPromo.code } : {}),
      ...(seed !== undefined ? { seed } : {}),
    }).then((response) => {
      if (response.ok) {
        dispatch({ type: 'PURCHASE_SUCCEEDED', result: response.data.result });
      } else {
        dispatch({ type: 'PURCHASE_FAILED', error: response });
      }
    });
  }, [state.phase, state.paymentMethodId, state.quantity, machine.slug, appliedPromo, seed]);

  const value = useMemo<ClawExperienceValue>(
    () => ({
      ...state,
      machine,
      paymentMethods,
      appliedPromo,
      quote,
      setQuantity: (quantity) => dispatch({ type: 'SET_QUANTITY', quantity }),
      applyPromo: (promo) => {
        setAppliedPromo(promo);
        dispatch({ type: 'SET_PROMO', code: promo?.code ?? null });
      },
      selectMethod: (id) => dispatch({ type: 'SET_METHOD', id }),
      openReview: () => dispatch({ type: 'OPEN_REVIEW' }),
      closeReview: () => dispatch({ type: 'CLOSE_REVIEW' }),
      confirm,
      finishReveal: () => dispatch({ type: 'REVEAL_FINISHED' }),
      dismissResult: () => dispatch({ type: 'DISMISS_RESULT' }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [state, machine, paymentMethods, appliedPromo, quote, confirm],
  );

  return <ClawExperienceContext.Provider value={value}>{children}</ClawExperienceContext.Provider>;
}
