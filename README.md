# Beezie — Claw Pull Experience

A recreation of Beezie's claw machine pull-and-reveal flow: pick a machine, choose how many pulls to buy, pay, then watch a full-screen video reveal of what you won and decide whether to swap it for cash or keep it.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4** and **shadcn/ui**.

> **Frontend only.** There is no backend. Everything that would be an API — catalogue, odds, inventory, pull resolution, wallets, purchases and swaps — is mocked in-repository behind a single typed boundary. The app runs with no environment variables and no network access.

---

## Running locally

Requires **Node 22+**.

```bash
npm install
npm run dev
```

Open <http://localhost:3000> — it redirects to the featured machine.

| Script              | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Start the dev server                              |
| `npm run build`     | Production build                                  |
| `npm start`         | Serve the production build                        |
| `npm run lint`      | ESLint, including the architecture boundary rules |
| `npm run typecheck` | `tsc --noEmit`                                    |
| `npm run test`      | Unit tests (66 tests)                             |

---

## Pages

| Route               | What it is                                                                             |
| ------------------- | -------------------------------------------------------------------------------------- |
| `/`                 | Server redirect to the featured machine                                                |
| `/claw/[slug]`      | The claw machine page — hero, pricing, odds, machine switcher, top items, recent pulls |
| `/dev/tokens`       | Dev-only preview of every design token                                                 |
| `/api/pulls/recent` | Mock endpoint backing the live recent-pulls feed                                       |

Four machines are seeded: `pokemon-gold`, `tcg-platinum`, `tcg-silver` and `wildcard`.

The payment modal and the reveal are **not** routes — they are in-page state. That is deliberate: a route transition risks unmounting the `<video>` element that was preloaded, which is exactly what the reveal depends on.

---

## Main features

**The claw page** — server-rendered idle video with poster fallback, live price and points that track the quantity stepper, an odds panel with the five rarity tiers, a machine switcher that works without JavaScript, a top items grid sorted by market value, and a recent pulls feed that polls for new entries.

**Purchase flow** — quantity stepper (keyboard operable, bounded by the machine's max), promo codes, and a review surface that is a centred dialog on desktop and a swipe-dismissable bottom sheet on mobile. Payment methods show their balances; the first one that can actually cover the order is preselected.

**The reveal** — a full-screen video that plays the instant you confirm, then hands off to either the single-item or multi-item result screen.

**Results** — one item gets a large card with `Swap Now` / `Keep Item`. More than one gets a selectable grid with per-item swap, `Select all` / `Clear`, a live expiry countdown, and an aggregate bar that swaps the whole selection at once.

**Responsive** — one component set serves desktop and mobile. Works from 320px up.

---

## Try these

```
/claw/pokemon-gold              default quantity 1 → single-item reveal
/claw/pokemon-gold?seed=7       set quantity to 3+ → multi-item reveal, reproducible
/claw/wildcard                  out of stock → restocking state
```

- **Quantity** is set with the stepper before hitting `Start Now`. One pull gives the single-item reveal, more than one gives the selectable grid.
- **Promo codes:** `BEEZIE10` (10% off) and `FIRSTPULL` ($50 off). Anything else shows the invalid state.
- **Insufficient funds:** the Beezie wallet holds $190 on purpose, so it can't cover a $500 pull. Select it in the payment modal to see the state.
- **`?seed=<number>`** forces a reproducible outcome — the same seed and quantity always yield the same items.

---

## How it's put together

```
src/
  app/                  routes, server actions, route handlers
  components/
    ui/                 shadcn primitives (regenerable, untouched)
    atoms/              Price, PointsBadge, RarityChip, ItemImage, Countdown
    molecules/          QuantityStepper, PromoCodeField, ItemCard, OddsTier
    organisms/          ClawHero, OddsPanel, PaymentReviewSurface, RevealOverlay
    templates/          ClawPageTemplate — owns the responsive grid
  data/
    mock/               fixtures
    repository.ts       the only seam the UI talks to
  lib/                  money, odds, state machine
  types/                domain types + zod schemas
```

Two deliberate deviations from textbook atomic design: shadcn primitives live in their own `ui/` layer below atoms so the CLI keeps working, and Next's `app/` replaces `pages/`.

**Server-first.** Components are server components by default. Client JavaScript is limited to the stepper, promo field, payment surface, reveal overlay and the feed poller — the hero, odds, top items and recent pulls all ship as HTML.

**Where a backend would attach.** Everything goes through `src/data/repository.ts`. Components never import fixtures directly — ESLint fails the build if they try. Swapping the mock for a real API is a one-file change.

**Money is integer cents.** Formatting happens once at the display boundary with the locale pinned to `en-US`, so the server and client can't disagree.

**Odds run on the server** in a module that never reaches the client bundle, seeded so any outcome is reproducible. For real money you'd want commit-reveal; that's out of scope here.
