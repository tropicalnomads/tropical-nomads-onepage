# Upcoming events

Ticket 08. The web app page is `apps/web/app/upcoming-events/page.tsx`. It calls the local API in process for `/events/upcoming` and `/partners`. No login. The list is sorted by `dateStart` ascending. The API finds `public/data` beside its source file. When the web bundle hides that directory, it uses the one-pager `public/data` next to `apps/web`.

The link rules live in `packages/shared/src/events/public-list.ts`. The one-pager keeps its own copies and still fetches `/data/events.json`. A party with no euro offer keeps an https seller link. A published party with a euro offer shows the in-app buy form from ticket 13. That form calls `issueTicketAction` and does not mark the payment confirmed. `javascript:` URLs are dropped. The timetable link stays on `https://timetable.tropical-nomads.com`.

Banners and partner logos are served from `apps/web/app/catalog-assets/[kind]/[file]/route.ts`. The only directories are `public/events/banners` and `public/partners` in the one-pager. The file name has to stay inside that directory, and the type has to be jpeg, png, or webp.

Interface labels are in `apps/web/src/i18n/copy.ts`. Event titles, artist names, and venue names stay the catalog strings.

Run `pnpm --filter tropical-nomads-shared test` and `pnpm --filter tropical-nomads-web test`. The one-pager `pnpm lint` and `pnpm build` still pass. The web shell is not deployed.

The next ticket must not require a login to read this list, translate the catalog strings, widen the image route, remove the one-pager list, or confirm a payment from this page.

## Seller link or euro offer

People still need the seller's link for parties that are not switched. A euro offer on a published party is the in-app sale. The one-pager does not get that form.
