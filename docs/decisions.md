# Architecture decisions

## ADR-001 — Google Sheets as the personal database

**Status:** Accepted. It meets the requested Drive-first workflow and keeps data inspectable. The tradeoff is Apps Script latency and limited scale.

## ADR-002 — Event log as source of truth

**Status:** Accepted. Weekly analytics require historical deltas and state transitions that a current-items table cannot reconstruct. Projections keep the Sheet readable.

## ADR-003 — Apps Script as the serialized writer

**Status:** Accepted. Vercel functions can run concurrently; a script lock enforces slot invariants across tabs and devices at the data boundary.

## ADR-004 — Manual next step

**Status:** Accepted. It is explicit, flexible across books/courses/custom resources, and avoids unreliable content inference.

## ADR-005 — Shared access phrase for v1

**Status:** Accepted for a single-user personal deployment. Secrets stay server-side and the session is HttpOnly. It is not sufficient for multi-user authorization.

## ADR-006 — No learning data in browser storage

**Status:** Accepted. The browser holds the current snapshot only in memory. Theme preference uses a cookie because it is presentation state, not learning data.

## ADR-007 — Native CSS and semantic HTML

**Status:** Accepted. The small app does not need a component framework. Native dialog, forms, navigation, and CSS variables keep the bundle and maintenance surface small.
