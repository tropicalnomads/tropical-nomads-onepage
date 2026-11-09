# 15 — Shop

**Status:** the buyer shop is on `/shop`. The name is Shop. Checkout is WhatsApp, not a charge. The one-pager reserve link stays until the owner retires it. `/shop` redirects to `/shop`.

## Outcome

The web app, including a phone browser, lists the two current T-shirts. The nav label is Shop in English and Loja in Portuguese. The path is `/shop`. A visitor adds sizes to a cart, writes a delivery address, and Buy opens WhatsApp `+49 176 48996011` with the quantities, shirt names, sizes, address, and the total last. Nothing is charged. The one-pager still reserves on its own WhatsApp number.

## Why it exists

`SHOP_PRODUCTS` in `apps/one-pager/src/lib/shop.ts` is the real catalog:

- `hw` — Tropical Groove Halloween, `/shop/HW_TEE_UV.webp`
- `pg` — Psy Groove, `/shop/PG_TEE_UV.webp`

`SHOP_PRICE_EUR` is 50. Sizes are `P`, `M`, `G`, `GG`, `2XL`, with English labels in `EN_SIZE`. Counts are `SHOP_STOCK`. A size at 0 is hidden by `liveSizes`.

The owner changed the concept: do not call this Shop, call it Shop, and do not wait for a payment company. The order is a WhatsApp message. Fulfillment is delivery, so the message includes the address. The one-pager number `+351 911 891 127` is not copied into the new shop.

## Depends on

- [05 — Web app repository](05-app-repos.md).
- [20 — English and Portuguese](20-internationalization.md).

Accounts and the payment interfaces are not required for this checkout.

## To-do

1. Show `hw` and `pg` in the web app, at phone width and desktop width, with the current names, images, and €50 price. Do not invent a third product.
2. Keep the image files in `apps/one-pager/public/shop/` and serve them from the web app.
3. Hide a size at count 0, using `SHOP_STOCK` until ticket 16 moves the counts.
4. Cart lines are a shirt, a size, and a quantity. Quantity cannot pass the listed stock.
5. Buy requires a name, street, city, postal code, and country. The WhatsApp text ends with the euro total.
6. Leave the one-pager WhatsApp reserve in place. Do not point it at `+49 176 48996011`.
7. Leave `startPayment` with purpose `shop` unused by this button. A later payment company can replace WhatsApp. Until then a shop order does not write a payment trace and does not reduce stock.
8. Adding a product and setting price, sizes, or stock stays ticket 16. A user or door session still cannot do that.

## Acceptance criteria

- `/shop` shows `hw` and `pg` with the current names, images, and €50 price.
- The visible name is Shop, not Shop.
- Buy opens `https://wa.me/4917648996011` only when the cart and the delivery address are complete. The text includes each shirt, size, quantity, the address, and the total at the end.
- The one-pager shop section still opens its existing WhatsApp reserve.

## Tests

Unit tests:

- Catalog mapping of the two ids matches name and image path.
- A complete cart message ends with the total and uses `4917648996011`.
- An empty cart, a blank address, or a quantity above stock does not produce a message.

The implementer runs those tests.
