import type { PullResult } from '@/types/catalogue';
import type { OperationError } from '@/types/operations';

export type Phase = 'idle' | 'reviewing' | 'purchasing' | 'revealing' | 'result' | 'settled';

export interface ExperienceState {
  phase: Phase;
  quantity: number;
  promoCode: string | null;
  paymentMethodId: string | null;
  result: PullResult | null;
  error: OperationError | null;
}

export type ExperienceEvent =
  | { type: 'SET_QUANTITY'; quantity: number }
  | { type: 'SET_PROMO'; code: string | null }
  | { type: 'SET_METHOD'; id: string }
  | { type: 'OPEN_REVIEW' }
  | { type: 'CLOSE_REVIEW' }
  | { type: 'CONFIRM' }
  | { type: 'PURCHASE_SUCCEEDED'; result: PullResult }
  | { type: 'PURCHASE_FAILED'; error: OperationError }
  | { type: 'REVEAL_FINISHED' }
  | { type: 'DISMISS_RESULT' }
  | { type: 'RESET' };

export function initialState(overrides: Partial<ExperienceState> = {}): ExperienceState {
  return {
    phase: 'idle',
    quantity: 1,
    promoCode: null,
    paymentMethodId: null,
    result: null,
    error: null,
    ...overrides,
  };
}

// Transitions are explicit so an event arriving in the wrong phase is a no-op.
export function reduce(state: ExperienceState, event: ExperienceEvent): ExperienceState {
  switch (event.type) {
    case 'SET_QUANTITY':
      return state.phase === 'idle' || state.phase === 'reviewing'
        ? { ...state, quantity: event.quantity }
        : state;

    case 'SET_PROMO':
      return state.phase === 'idle' || state.phase === 'reviewing'
        ? { ...state, promoCode: event.code }
        : state;

    case 'SET_METHOD':
      return { ...state, paymentMethodId: event.id };

    case 'OPEN_REVIEW':
      return state.phase === 'idle' ? { ...state, phase: 'reviewing', error: null } : state;

    case 'CLOSE_REVIEW':
      return state.phase === 'reviewing' ? { ...state, phase: 'idle', error: null } : state;

    case 'CONFIRM':
      // A second CONFIRM while purchasing cannot re-enter the transition.
      return state.phase === 'reviewing' ? { ...state, phase: 'purchasing', error: null } : state;

    case 'PURCHASE_SUCCEEDED':
      return state.phase === 'purchasing'
        ? { ...state, phase: 'revealing', result: event.result, error: null }
        : state;

    case 'PURCHASE_FAILED':
      return state.phase === 'purchasing'
        ? { ...state, phase: 'reviewing', error: event.error }
        : state;

    case 'REVEAL_FINISHED':
      return state.phase === 'revealing' ? { ...state, phase: 'result' } : state;

    case 'DISMISS_RESULT':
      return state.phase === 'result' || state.phase === 'revealing'
        ? { ...state, phase: 'settled' }
        : state;

    case 'RESET':
      return initialState({
        quantity: state.quantity,
        paymentMethodId: state.paymentMethodId,
      });

    default:
      return state;
  }
}
