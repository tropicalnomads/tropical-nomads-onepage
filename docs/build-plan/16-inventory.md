# 16 — Inventory

**Status:** not started. Stock becomes private JSON.

## Outcome

Size counts for `hw` and `pg` live in the private stock JSON. A completed merch sale reduces the count. Until the payment provider exists, a `pending_provider` start does not reduce stock. The team can correct counts. The store shows availability without the full history.

## Why it exists

`MERCH_STOCK` is a constant. Two checkouts cannot see each other, and the public bundle contains every count. Stock should move when a sale is real, which means a confirmed payment, not a stub start.

## Depends on

- [09 — Security baseline](09-security-baseline.md).
- [15 — Merch store](15-merch-store.md).

## To-do

1. Move `MERCH_STOCK` counts into the private stock collection, keyed by product id and size (`P`, `M`, `G`, `GG`, `2XL`). Keep `EN_SIZE` for English labels. Portuguese labels on the one-pager stay the codes (`sizeLabel`). Do not add languages.
2. Point the apps at these counts. Hide a size at 0.
3. Decrement only when a merch payment is confirmed. The stub adapter never confirms, so tests decrement through a fixture confirmed trace or through an inventory-admin correction. A page view and the WhatsApp link do not decrement.
4. Inventory admin can see counts, add stock, and correct a count. Record who, when, and the old and new values.
5. The customer sees available sizes, not the correction history.
6. Leave the one-pager constants in place until the owner retires the WhatsApp shop.
7. Do not treat `stockMeterPercent` as inventory.

## Acceptance criteria

- Two confirmed purchases of the last unit cannot both succeed.
- A `pending_provider` payment does not change the count.
- An admin correction records the actor.
- The one-pager shop still renders its current counts.

## Tests

Unit tests:

- Decrement of the last unit succeeds once and fails the second time.
- Decrement on `pending_provider` leaves the count unchanged.
- The count cannot go below zero.
- A correction stores old value, new value, and actor id.

The implementer runs those tests and the one-pager build.
