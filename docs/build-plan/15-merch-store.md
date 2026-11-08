# 15 — Merch store

**Status:** not started. Catalog in the web app, starting from the two shirts. The one-pager WhatsApp shop stays until the owner retires it.

## Outcome

The web app, including a phone browser, lists the two current T-shirts from catalog data. A signed-in customer with a billing address can start a merch payment through the ticket 12 interface. The charge stays `pending_provider` until a provider exists. The one-pager still reserves on WhatsApp.

## Why it exists

`MERCH_PRODUCTS` in `src/lib/merch.ts` is the real catalog:

- `hw` — Tropical Groove Halloween, `/merch/HW_TEE_UV.webp`, stock note `lastRun`
- `pg` — Psy Groove, `/merch/PG_TEE_UV.webp`, stock note `madeToOrder`

`MERCH_PRICE_EUR` is 50. Pickup copy is The Sound House, Dublin. Sizes are `P`, `M`, `G`, `GG`, `2XL`, with English labels in `EN_SIZE`. Counts are `MERCH_STOCK`. A size at 0 is hidden by `liveSizes`. The owner wants merch to use the same payment methods as tickets.

## Depends on

- [05 — Web app repository](05-app-repos.md).
- [10 — Accounts and profile](10-accounts-and-profile.md).
- [12 — Payment interfaces](12-payment-interfaces.md).
- [20 — English and Portuguese](20-internationalization.md).

## To-do

1. Represent `hw` and `pg` as catalog data the API can read: id, name, image path, alt, price, currency, pickup copy, stock note, and sizes. Do not invent a third product.
2. Keep the image files in `public/merch/` so the one-pager and the web app can use them.
3. Show the catalog in the web app, at phone width and desktop width. Hide a size at count 0, using `MERCH_STOCK` until ticket 16 moves the counts.
4. `startPayment` with purpose `merch` is the buy action. It requires a signed-in user and a billing address. It does not capture money.
5. Ask whether fulfillment stays pickup at The Sound House, becomes shipping, or is both. Do not guess. The product can be seen either way.
6. Leave the one-pager WhatsApp reserve in place until the owner retires it. Do not copy the shop phone number into new public JSON.
7. Leave `stockMeterPercent` as display. It is not the stock system.
8. This ticket is the buyer store. Adding a product and setting price, sizes, or stock is ticket 16, and only the admin role can do it. A user or door session that calls those writes is denied.

## Acceptance criteria

- The web app shows `hw` and `pg` with the current names, images, and €50 price.
- Starting a purchase calls `startPayment` with purpose `merch` and stays `pending_provider`.
- The one-pager merch section still opens WhatsApp.

## Tests

Unit tests:

- Catalog mapping of the two ids matches name and image path.
- `liveSizes` hides count 0.
- Merch `startPayment` includes the product id and size in the reference and rejects a missing billing address.

The implementer runs those tests and the one-pager build.
