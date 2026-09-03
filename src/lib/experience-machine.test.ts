import { describe, expect, it } from 'vitest';

import type { PullResult } from '@/types/catalogue';
import type { OperationError } from '@/types/operations';

import { initialState, reduce, type ExperienceState, type Phase } from './experience-machine';

const RESULT = { id: 'pull-1', items: [] } as unknown as PullResult;
const ERROR: OperationError = { ok: false, code: 'unavailable', message: 'nope' };

function at(phase: Phase, overrides: Partial<ExperienceState> = {}): ExperienceState {
  return initialState({ phase, ...overrides });
}

describe('experience machine', () => {
  it('starts idle at quantity 1', () => {
    expect(initialState()).toMatchObject({ phase: 'idle', quantity: 1, result: null });
  });

  it('walks the happy path end to end', () => {
    let state = initialState();
    state = reduce(state, { type: 'OPEN_REVIEW' });
    expect(state.phase).toBe('reviewing');
    state = reduce(state, { type: 'CONFIRM' });
    expect(state.phase).toBe('purchasing');
    state = reduce(state, { type: 'PURCHASE_SUCCEEDED', result: RESULT });
    expect(state.phase).toBe('revealing');
    state = reduce(state, { type: 'REVEAL_FINISHED' });
    expect(state.phase).toBe('result');
    state = reduce(state, { type: 'DISMISS_RESULT' });
    expect(state.phase).toBe('settled');
  });

  it('returns to reviewing on failure with selections intact', () => {
    const state = at('purchasing', { quantity: 5, promoCode: 'BEEZIE10', paymentMethodId: 'card' });
    const next = reduce(state, { type: 'PURCHASE_FAILED', error: ERROR });
    expect(next).toMatchObject({
      phase: 'reviewing',
      quantity: 5,
      promoCode: 'BEEZIE10',
      paymentMethodId: 'card',
      error: ERROR,
    });
  });

  it('ignores a second CONFIRM while purchasing', () => {
    const purchasing = at('purchasing');
    expect(reduce(purchasing, { type: 'CONFIRM' })).toBe(purchasing);
  });

  it('ignores quantity changes once the purchase is in flight', () => {
    for (const phase of ['purchasing', 'revealing', 'result'] as const) {
      const state = at(phase, { quantity: 3 });
      expect(reduce(state, { type: 'SET_QUANTITY', quantity: 9 }).quantity).toBe(3);
    }
  });

  it('allows quantity and promo changes while idle or reviewing', () => {
    for (const phase of ['idle', 'reviewing'] as const) {
      expect(reduce(at(phase), { type: 'SET_QUANTITY', quantity: 4 }).quantity).toBe(4);
      expect(reduce(at(phase), { type: 'SET_PROMO', code: 'X' }).promoCode).toBe('X');
    }
  });

  it('clears the error when the review reopens', () => {
    const state = at('idle', { error: ERROR });
    expect(reduce(state, { type: 'OPEN_REVIEW' }).error).toBeNull();
  });

  it('allows skipping the reveal straight to settled', () => {
    expect(reduce(at('revealing'), { type: 'DISMISS_RESULT' }).phase).toBe('settled');
  });

  it('ignores REVEAL_FINISHED outside revealing', () => {
    for (const phase of ['idle', 'reviewing', 'purchasing', 'result', 'settled'] as const) {
      expect(reduce(at(phase), { type: 'REVEAL_FINISHED' }).phase).toBe(phase);
    }
  });

  it('ignores CLOSE_REVIEW outside reviewing', () => {
    for (const phase of ['idle', 'purchasing', 'revealing', 'result'] as const) {
      expect(reduce(at(phase), { type: 'CLOSE_REVIEW' }).phase).toBe(phase);
    }
  });

  it('resets to idle while preserving quantity and payment method', () => {
    const state = at('settled', {
      quantity: 7,
      paymentMethodId: 'card',
      promoCode: 'BEEZIE10',
      result: RESULT,
    });
    expect(reduce(state, { type: 'RESET' })).toMatchObject({
      phase: 'idle',
      quantity: 7,
      paymentMethodId: 'card',
      promoCode: null,
      result: null,
    });
  });
});
