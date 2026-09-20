# Focus Shelf project reference

## Product statement

Focus Shelf helps one learner explore freely, start selectively, and finish deliberately. It reduces work-in-progress through one Main and one Side slot while preserving a trusted queue and explicit outcomes.

## Status matrix

| Capability | Status | Evidence |
|---|---|---|
| Responsive board and dark/light UI | Confirmed | `components/focus-app.tsx`, `app/globals.css` |
| Parking/Paused/Done/Dropped shelf | Confirmed | Board dialogs and domain states |
| Manual next step | Confirmed | Item field and edit flow |
| Flexible progress and corrections | Confirmed | UI controls and signed event deltas |
| Weekly analytics and review | Confirmed | `/analytics`, `lib/analytics.mjs` |
| Google Sheet and cover folder | Confirmed | IDs in README and setup guide |
| Apps Script source | Confirmed | `apps-script/` |
| Production build and tests | Confirmed | `npm test`, `npm run typecheck`, `npm run build` |
| Live Apps Script deployment | Needs configuration | Requires owner OAuth approval in Google |
| Live Vercel production URL | Needs configuration | Requires Vercel CLI/account login and environment secrets |

## Data dictionary

`Learning Items`: ID, Title, Type, Cover File ID, Resource URL, State, Unit, Custom Unit, Current, Total, Why, Done Definition, Next Step, Queue Position, Added At, Started At, Updated At, Finished At, Version.

`Events`: ID, Request ID, Item ID, Kind, At, Delta, Unit, From State, To State, Payload JSON.

`Weekly Reviews`: Week Start, Learned, Adjust, Next Step, Updated At, Version.

## Open questions

- Whether to add managed identity if the app later has multiple users.
- Whether Parking should support drag-and-drop ordering; v1 uses numeric queue position.
- Whether to add goal streaks. They are intentionally excluded from v1 to avoid punitive motivation.

## Traceability examples

| Requirement | UI | Server/domain | Storage | Test |
|---|---|---|---|---|
| One Main slot | Disabled promotion | `slotCheck` under lock | State transition event | `enforces one resource per active slot` |
| Progress correction | Minus/type + Save | Signed delta | Progress event | `net corrections` |
| Weekly review | Analytics form | Versioned review action | Review event + projection | `review accepts only a real Sunday` |
| No local data | In-memory snapshot | Server bridge | Google resources | Architecture review |
