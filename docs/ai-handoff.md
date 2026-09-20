# AI maintainer guide

This document is the fast context for an AI coding assistant.

## Non-negotiable invariants

1. No learning data in `localStorage`, IndexedDB, or client cookies.
2. Main and Side each have a hard capacity of one, enforced inside the Apps Script lock.
3. Events are append-only source data. Never make projections authoritative.
4. A retry of one logical mutation must reuse its `requestId`.
5. Every edit/progress/state/review uses `expectedVersion`.
6. Analytics uses Cairo local dates and never sums unlike units.
7. Next step is user-authored text, not inferred content.
8. Drive cover files remain private and are streamed only through the authenticated API.

## Safe change procedure

- Trace UI → `/api/data` action → `makeEvent` rule → event row → projection → analytics.
- Add or update a domain test for invariant changes and an analytics test for date/aggregation changes.
- Run `npm test`, `npm run typecheck`, and `npm run build`.
- If the event payload shape changes, keep backward compatibility in `reduceEvents` or provide a migration.
- Do not rename Sheet tabs or reorder projection columns without updating `Code.gs`, `domain.js`, and documentation together.

## Source-of-truth precedence

1. `apps-script/domain.js` for domain validation and transitions.
2. `apps-script/Code.gs` for persistence and cover security.
3. `lib/types.ts` for client data types.
4. `docs/business-rules.md` for intended behavior.

If code and docs conflict, flag it; do not silently assume one is correct.
