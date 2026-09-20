# API

All responses are JSON. Data and cover routes require the `focus_session` cookie. Mutations require an exact `Origin` match.

## Session

### `GET /api/session`

Returns `{ configured, authenticated }`.

### `POST /api/session`

Body: `{ "phrase": "…" }`. Creates a seven-day HttpOnly session when the phrase hash matches `APP_ACCESS_HASH`.

### `DELETE /api/session`

Clears the session.

## Data

### `GET /api/data`

Returns `{ items, events, reviews, timeZone }` from the Google backend.

### `POST /api/data`

Envelope: `{ action, payload, requestId }`. `requestId` must be 16–80 word/hyphen characters and must be reused when retrying the same logical write.

| Action | Required payload | Result |
|---|---|---|
| `create` | Resource fields | New version-1 item event |
| `update` | `id`, `expectedVersion`, editable fields | Updated item event |
| `progress` | `id`, `expectedVersion`, absolute `current` | Signed-delta progress event |
| `state` | `id`, `expectedVersion`, `state` | State transition event |
| `review` | `weekStart`, `expectedVersion`, reflection fields | Weekly review event |
| `uploadCover` | `base64`, `mime` | `{ fileId }` |

Errors use `{ error, code }`. Important codes: `ACCESS`, `ORIGIN`, `VALIDATION`, `CONFLICT`, `SLOT_FULL`, `NOT_FOUND`, `NOT_CONFIGURED`, and `CONNECTION`.

## Cover

### `GET /api/cover/:id`

Streams an authenticated image after the backend verifies both folder membership and an item reference. Response cache is private.

## Apps Script protocol

Vercel posts `{ body, signature }`, where `body` is the exact JSON string `{ action, payload, requestId, at }` and `signature` is its HMAC-SHA256 hex digest. Do not call Apps Script directly from a browser.
