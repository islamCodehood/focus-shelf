# Architecture

## Runtime boundaries

1. The React client talks only to `/api/session`, `/api/data`, and `/api/cover/:id` on the Vercel origin.
2. Next.js validates the private session and mutation origin, then signs a timestamped request with HMAC-SHA256.
3. Google Apps Script verifies the signature, checks freshness, acquires a script-wide lock, applies domain rules, appends one event, and rebuilds readable projections.
4. Google Sheets stores the durable event log and projections. Drive stores cover files in one private folder.

## Data consistency

`Events` is the source of truth. `Learning Items` and `Weekly Reviews` are projections and may be rebuilt at any time. A write appends its event and flushes it before projection updates; therefore an interruption cannot silently lose a committed change. The next snapshot rebuilds the views.

Each mutation includes:

- `requestId`: retry idempotency; replay returns the already-created event.
- `expectedVersion`: optimistic concurrency; stale forms return `CONFLICT`.
- Apps Script lock: serializes concurrent devices and preserves the one-Main/one-Side invariant.

## Trust model

| Boundary | Control |
|---|---|
| Internet → app | Access phrase hashed with SHA-256; signed, HttpOnly, SameSite=Strict session cookie |
| Browser mutation → Vercel | Exact-origin check and request-size limit |
| Vercel → Apps Script | HMAC signature, two-minute timestamp window, request ID validation |
| Cover access | Session required; file must be referenced by an item and belong to the configured private folder |
| Spreadsheet text | Formula-prefix neutralization in projections |

This is a single-user personal application, not a multi-tenant identity system. If it becomes shared, replace the access phrase with a managed identity provider and add per-user ownership to every event.

## Availability and scale

The event reducer is O(n) per request, appropriate for a personal tracker. For tens of thousands of events, checkpoint snapshots or migrate the event store to Postgres while retaining the same API contract.
