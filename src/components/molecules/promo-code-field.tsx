'use client';

import { Check, ChevronDown, X } from 'lucide-react';
import { useId, useRef, useState, useTransition } from 'react';

import { checkPromoAction } from '@/app/claw/[slug]/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PromoCode } from '@/types/catalogue';

interface PromoCodeFieldProps {
  applied: PromoCode | null;
  onApply: (promo: PromoCode | null) => void;
}

export function PromoCodeField({ applied, onApply }: PromoCodeFieldProps) {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Collapsed below md, matching the mobile Figma; always open on desktop.
  const [expanded, setExpanded] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (code.trim() === '') {
      setError('Enter a code to apply.');
      inputRef.current?.focus();
      return;
    }

    startTransition(async () => {
      const promo = await checkPromoAction(code);
      if (promo) {
        setError(null);
        onApply(promo);
      } else {
        setError('That code is not valid or has expired.');
        onApply(null);
      }
    });
  };

  const remove = () => {
    onApply(null);
    setCode('');
    setError(null);
  };

  if (applied) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-value/40 bg-value/10 px-3 py-2">
        <Check aria-hidden className="size-4 shrink-0 text-value" />
        <span className="min-w-0 flex-1 truncate text-xs">
          <span className="font-semibold">{applied.code}</span>
          <span className="text-foreground-muted"> — {applied.label}</span>
        </span>
        <button
          type="button"
          onClick={remove}
          aria-label={`Remove promo code ${applied.code}`}
          className="grid size-6 shrink-0 place-items-center rounded text-foreground-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`${inputId}-region`}
        onClick={() => {
          setExpanded(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="flex min-h-11 items-center gap-1 text-xs text-foreground-muted hover:text-foreground md:hidden"
      >
        Apply promo code
        <ChevronDown aria-hidden className="size-3.5" />
      </button>

      <label htmlFor={inputId} className="hidden text-xs text-foreground-muted md:block">
        Apply promo code
      </label>

      <div id={`${inputId}-region`} className={expanded ? 'mt-1.5' : 'mt-1.5 hidden md:block'}>
        <form onSubmit={submit} className="flex gap-2" noValidate>
          <Input
            ref={inputRef}
            id={inputId}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError(null);
            }}
            placeholder="Enter Code"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-11 flex-1 border-border bg-surface-2"
          />
          <Button type="submit" variant="secondary" disabled={pending} className="h-11 px-5">
            {pending ? 'Checking…' : 'Apply'}
          </Button>
        </form>

        {error ? (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
