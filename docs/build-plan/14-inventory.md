# 14 — Inventory

**Status:** not started. Stock becomes data the team can correct and a sale can decrement.

## Outcome

The two shirts' size counts live in the private stock JSON. A completed merch sale reduces the count, so two customers cannot take the last piece. The team can see and correct stock. The store shows availability that matches those counts, without publishing the full stock history.

## Why it exists

`MERCH_STOCK` is a constant. Editing it means a code change, two checkouts cannot see each other, and the public bundle contains every count. The master plan's inventory capability is stock control: arrivals, sales, and corrections, with the store following the count.

## Depends on

- [08 — Security baseline](08-security-baseline.md). Inventory admin is team-only, and a stock change records who did it.
- [13 — Merch store](13-merch-store.md). The catalog ids `hw` and `pg` exist, with the same size codes.

## To-do

1. Move the counts in `MERCH_STOCK` into the private stock collection from ticket 09, keyed by product id and size code (`P`, `M`, `G`, `GG`, `2XL`). Keep the English labels (`S`, `M`, `L`, `XL`, `2XL`) as display, the way `EN_SIZE` does for `en`. Portuguese size labels on the one-pager stay the codes themselves (`sizeLabel`). Do not decide new languages.
2. Point the app's merch area at these counts. Hide a size at 0, as `liveSizes` does.
3. When the owner has said a merch sale is complete (ticket 13's payment answer), decrement inside the API in the same step as the sale. If merch payment is still open, decrement only from an inventory-admin action, and say so in the ticket notes. Do not decrement from a page view or from the WhatsApp link.
4. Give inventory admin a team-only screen: see counts, add stock, correct a count. Record who changed it, when, and the old and new values, per ticket 08.
5. Show the customer "available" or "sold out" (and the sizes still in stock). Do not ship the correction history or the admin's notes in `public/data` or in the app's public payload.
6. After the app reads the private counts, remove the live dependence on `MERCH_STOCK` for the app. Leave the one-pager's constants in place until the owner retires the WhatsApp shop, so www does not lose its stock display in the same step.
7. Do not treat `stockMeterPercent` as inventory. It is a visual scale on the current page.

## Done when

The API holds the size counts, a completed sale or an admin correction changes them, the app matches those counts, two overlapping purchases cannot both take the last unit, and the one-pager shop still renders until the owner turns it off.
