# 13 — Merch store

**Status:** not started. Catalog in the app, starting from the two shirts already on the page. The one-pager shop stays until the owner retires it.

## Outcome

The app's merch area lists T-shirts, and can list other products later, from data rather than from constants. The first catalog is the two shirts the page sells today. Availability shown to the customer comes from inventory once ticket 14 lands. Until then the area shows the products and the current counts as read-only.

## Why it exists

The page already sells merch, but only as a section that opens WhatsApp. `MERCH_PRODUCTS` in `src/lib/merch.ts` has:

- `hw` — Tropical Groove Halloween, image `/merch/HW_TEE_UV.webp`, stock note `lastRun`
- `pg` — Psy Groove, image `/merch/PG_TEE_UV.webp`, stock note `madeToOrder`

`MERCH_PRICE_EUR` is 50. Pickup copy is The Sound House, Dublin. Sizes are `P`, `M`, `G`, `GG`, `2XL`, with English labels in `EN_SIZE`. Counts live in `MERCH_STOCK`. A size with count 0 is hidden by `liveSizes`. None of this is in `public/data`.

The product store is a catalog a customer can buy from. Which other products exist, whether checkout uses the ticket payment path, and whether fulfillment stays pickup, are open.

## Depends on

- [04 — App shell](04-app-shell.md). The merch area exists on web, iOS, and Android.
- [09 — Private operational data](09-private-operational-data.md). Product records should not be stuck only inside the one-pager bundle if the API is going to sell them. Public images can stay in `public/merch/`.

## To-do

1. Represent `hw` and `pg` as catalog data the API can read: id, name, image path, image alt, price, currency, pickup copy, stock note, and sizes. Start from the values in `src/lib/merch.ts`. Do not invent a third product.
2. Keep the image files where they are (`public/merch/HW_TEE_UV.webp`, `public/merch/PG_TEE_UV.webp`) so the one-pager and the app can both use them.
3. Show that catalog in the app on all three platforms. Show a size only when its count is above zero, matching `liveSizes`, using the counts still in `MERCH_STOCK` until ticket 14 moves them.
4. Ask the owner whether a shirt is paid through ticket 10's payment capability, and whether fulfillment stays pickup at The Sound House, becomes shipping, or is both. Do not guess. Do not build a second checkout while that answer is open. The customer can see the product either way.
5. Leave the one-pager's WhatsApp reserve (`whatsappReserveUrl` in `src/lib/merch.ts`, used by `MerchSection`) in place until the owner says the in-app store replaces it. Do not copy the phone number into new docs or new public JSON.
6. Leave `stockMeterPercent` on the one-pager as display. The meter (full at 10 pieces) is not the stock system. Ticket 14 owns the count.
7. Do not add products that are not on the page. "Other merchandise" means the catalog can gain items the owner names later, not that this ticket fills them in.

## Done when

Web, iOS, and Android show the two current shirts from catalog data, the one-pager still reserves on WhatsApp, and payment and shipping for merch are either the owner's answers or still explicit stops.
