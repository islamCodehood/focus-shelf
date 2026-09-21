# Testing

## Running tests

```bash
npm test
```

This runs `node --test tests/*.test.mjs` — Node's built-in test runner (`node:test`) with `node:assert/strict`. There is no test framework, mocking library, or DOM/React testing setup; the suite covers pure logic only (`apps-script/domain.js` and `lib/analytics.mjs`), not `components/focus-app.tsx` or the API routes. Always pair a logic change with `npm run typecheck` and `npm run build` — see the safe-change procedure in [`ai-handoff.md`](ai-handoff.md).

## `tests/domain.test.mjs` — domain rule tests

Tests `apps-script/domain.js` directly (it's a CommonJS module also loaded verbatim into Apps Script's V8 runtime, so it has no Node-only dependencies to stub out).

Conventions used throughout the file:

- **Fixed inputs, not `Date.now()`/`crypto.randomUUID()`.** `now` is a literal ISO string; request IDs are literal UUID-shaped strings. This keeps assertions deterministic and makes idempotency tests possible (reusing the exact same `requestId` twice).
- **`empty()`** builds a blank `{items: [], reviews: [], events: [], timeZone: 'Africa/Cairo'}` snapshot.
- **`create(overrides, requestId)`** calls `domain.makeEvent(empty(), 'create', {...defaults, ...overrides}, requestId, now, 'item-1')` — the shared starting point for tests that need an existing item. Build a snapshot from its result with `domain.reduceEvents([event])` before testing a second action against it.
- **Assert on `error.code`**, not message text: `assert.throws(() => domain.makeEvent(...), e => e.code === 'SLOT_FULL')`. The codes (`VALIDATION`, `CONFLICT`, `SLOT_FULL`, `NOT_FOUND`, `ACTION`) are the same ones surfaced to the client in `api.md`.

To add a test for a new or changed invariant:

1. Add/extend a case in `tests/domain.test.mjs` using `create()`/`reduceEvents()` to reach the state under test.
2. Assert both the happy path (resulting `event.payload`/`event.delta`) and the rejection path (`error.code`) if the rule can be violated.
3. If the rule affects `validateItem` specifically, a single `create({...})` call with the invalid field is usually enough — no need to go through `makeEvent`'s action branches.

## `tests/analytics.test.mjs` — analytics tests

Tests `lib/analytics.mjs` (`localDay`, `weekSummary`) with hand-built event fixtures via a small `event(id, itemId, at, delta, unit, kind, fromState, toState)` helper. Key things to cover when extending:

- **Timezone/day-boundary behavior** — `localDay` converts an ISO instant to a Cairo (`Africa/Cairo`) calendar day; test cases near midnight UTC (e.g. `22:30 UTC` rolling to the next Cairo day) are the ones most likely to break.
- **Aggregation correctness** — `weekSummary` groups progress by `itemId + unit` so two different units on the same item never get summed together (assert on `result.progress`, not just totals).
- **Net vs. gross progress** — a negative-delta correction event should reduce the net sum, not be excluded or floored at zero.

To add a test for a new aggregation or a new date-boundary case, extend the `event(...)` fixture list and assert on the relevant field of `weekSummary`'s return value (`activeDays`, `advanced`, `completed`, `days`, `progress`).

## What's intentionally not covered

The suite does not exercise `lib/server.ts` (sessions, signing, origin checks), the `app/api/*/route.ts` handlers, or `apps-script/Code.gs` (sheet I/O, cover upload/verification, locking) — these require a live Vercel/Apps Script/Sheets environment and are instead verified with the manual smoke test in [`setup.md`](setup.md). If you change request signing, session cookies, or the Apps Script HTTP boundary, re-run that smoke test rather than looking for automated coverage.
