# Frontend

The entire UI lives in one client component, `components/focus-app.tsx`, rendered by both `app/page.tsx` (`page="board"`) and `app/analytics/page.tsx` (`page="analytics"`). There is no component framework or router state beyond Next.js's own two routes; `<Link>` navigation switches the `page` prop. `app/layout.tsx` and `app/globals.css` provide the shell and all styling. This file documents *how* the UI calls the API contract in [`api.md`](api.md); the contract's validity rules stay in [`business-rules.md`](business-rules.md).

## Top-level state (`FocusApp`)

| State | Purpose |
|---|---|
| `session` | `{configured, authenticated}` from `GET /api/session`. `null` while loading. |
| `data` | The current `Snapshot` (`items`, `events`, `reviews`, `timeZone`). Starts as `EMPTY`. |
| `loading` / `busy` | `loading` guards the initial fetch; `busy` disables inputs during any in-flight mutation. |
| `error` / `notice` | `error` renders a dismissible banner with retry/reload actions; `notice` is a 4-second toast ("Saved"). |
| `dark` | Theme flag, seeded from the `focus_theme` cookie or `prefers-color-scheme`. |
| `demo` | True after "Explore with sample data" — see [Demo mode](#demo-mode). |
| `editing` / `queue` / `completion` | Which modal is open: the add/edit form, the Parking/Paused/Done/Dropped shelf browser, or the "finish deliberately" confirmation. |
| `week` | The selected analytics week (`YYYY-MM-DD`, a Sunday), defaulting to the last completed Cairo week. |
| `retry` (ref) | The last failed mutation request (`{action, payload, requestId}`), offered back via a "Retry save" button. |
| `inFlight` (ref) | Prevents overlapping mutations (`mutate` no-ops if one is already running). |

Render branches in order: loading → unauthenticated gate (login form or "Connection setup needed", plus the demo entry point) → authenticated shell (`board` or `analytics` content inside the shared topbar/nav).

## The mutate/retry pattern

`api(url, options)` wraps `fetch`, always sends `cache: 'no-store'`, and throws `Error(d.error)` on a non-OK response.

`mutate(action, payload, retryId?)` is the single path for every write (`create`, `update`, `progress`, `state`, `review`, `uploadCover`):

1. Refuses to run if another mutation is in flight, or if `demo` is on (shows a message instead of hitting the network).
2. Generates a `requestId` with `crypto.randomUUID()` unless `retryId` is passed (the retry path reuses the original ID so the server-side idempotency check in `domain.js`'s `makeEvent` returns the already-created event instead of duplicating it).
3. On success, replaces `data` with the server's fresh snapshot and clears `retry.current`.
4. On failure, stores the request in `retry.current` so the error banner's "Retry save" button can resubmit it unchanged.

Every write that targets an existing item/review sends `expectedVersion` from the currently-rendered record, giving the server's optimistic-concurrency check (`CONFLICT`) something to compare against. See [`api.md`](api.md) for the server side of this contract.

## Sub-components

- **`Modal`** — wraps a native `<dialog>`, calls `showModal()`/`close()` on mount/unmount, and closes on backdrop click or `Esc` (`onCancel`).
- **`Cover`** — renders `/api/cover/:id` via `next/image` (`unoptimized`, since covers are already compressed client-side) with a type-icon fallback (`BookOpen`/`GraduationCap`) if there's no cover or the image fails to load.
- **`Progress`** — the label + `role="progressbar"` track shown on `ResourceCard`; `pct()` clamps to 100% and treats a `null` total as "Total not set".
- **`ResourceCard`** — the Main/Side slot card: cover, next-step button (opens edit), progress stepper (± by 1 for whole-number units, ±0.5 otherwise) with a Save button, and Pause/Done/Drop actions. Done routes through the parent's `completion` confirmation dialog instead of transitioning directly.
- **`ItemForm`** — the add/edit form used inside `Modal`. Notable behavior:
  - `compressCover(file)` validates type/size client-side, downsamples to a max 800px canvas, re-encodes as JPEG at quality 0.8, and rejects anything still over ~660KB *before* calling `uploadCover` — this is what keeps requests under the server's 500KB cover limit and the API route's 850KB body cap.
  - The progress-unit select and the "already completed" field are disabled once an item has recorded progress and isn't new, matching the server-side rule that a unit can't change after progress exists.
  - Client-side re-checks `current <= total` before submitting, but the server (`validateItem` in `domain.js`) is still authoritative.
- **`ReviewForm`** — the weekly-reflection form (`learned`, `adjust`, `nextStep`), keyed by `week + version` so switching weeks or a stale version resets the form to the right draft instead of leaking edits across weeks.

## Demo mode

`startDemo()` populates `data` with hand-built sample items/events entirely in memory and sets `demo = true`. It exists so a visitor can see the board and analytics without a configured backend. While `demo` is true, `mutate` short-circuits with an explanatory message instead of calling the API, and destructive/irreversible-looking actions (add, progress, sign-out network call) are guarded accordingly.

## Theming

`dark` drives `document.documentElement.dataset.theme` (`'light' | 'dark'`), which selects the CSS custom-property block in `app/globals.css`: `:root { --bg: …; --panel: …; --text: …; … }` for light, redefined under `[data-theme=dark]` for dark (colors only — spacing/radius/shadow tokens are shared). The chosen theme is persisted in a `focus_theme` cookie (`Path=/; Max-Age=31536000; SameSite=Lax`) — deliberately *not* `localStorage`, and not treated as learning data (see ADR-006 in [`decisions.md`](decisions.md)). `globals.css` also defines a `prefers-reduced-motion` override that disables animation/transition durations globally.

## Adding a UI feature

1. Confirm the change against [`business-rules.md`](business-rules.md) first — if it changes what's valid, it likely needs a `domain.js` change and a new test (see [`testing.md`](testing.md)), not just a UI change.
2. Extend `Item`/`Review`/`Snapshot` in `lib/types.ts` if the data shape changes, keeping it in sync with `ITEM_KEYS` in `apps-script/domain.js` and the sheet columns in `PROJECT_REFERENCE.md`'s data dictionary.
3. Route new fields through `ItemForm`'s `draft` state and the relevant `mutate(...)` payload; don't bypass `mutate` for writes, or you lose the retry/idempotency/version-conflict handling for free.
