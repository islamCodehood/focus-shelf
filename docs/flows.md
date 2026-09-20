# User and system flows

## Add and activate a resource

1. Add title, type, optional cover/link, unit, total, purpose, definition of done, and manual next step.
2. Choose Parking, Paused, or a free active slot.
3. The server validates capacity under a global lock and appends a `create` event.
4. The sheet projections refresh and the UI receives the new snapshot.

## Record progress

1. Increase, decrease, or type the absolute current value.
2. Save sends the resource version and a fresh request ID.
3. The backend rejects stale versions, derives the signed delta, and appends the event.
4. Retrying after a network failure reuses the same request ID, preventing double counting.

## Finish, pause, or drop

1. The user selects an action on Main or Side.
2. Done shows the definition of done and confirms that partial progress is valid.
3. The state event frees the slot; history and progress remain available in the shelf.

## Weekly review

1. Analytics defaults to the last completed Cairo week.
2. The page computes activity and net movement from events.
3. The user records learning, adjustments, and one next small step.
4. Review versioning prevents a stale tab from overwriting a newer reflection.
