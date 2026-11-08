# Upcoming events

Ticket 08. The web app page is `apps/web/app/upcoming-events/page.tsx`. It calls the local API in process for `/events/upcoming` and `/partners`. No login. The list is sorted by `dateStart` ascending. The API finds `public/data` beside its source file. When the web bundle hides that directory, it uses the one-pager `public/data` next to `apps/web`.

The link rules live in `packages/shared/src/events/public-list.ts`. The one-pager keeps its own copies and still fetches `/data/events.json`. A ticket button is an https link that leaves the app. It does not post a payment. `javascript:` URLs are dropped. The timetable link stays on `https://timetable.tropical-nomads.com`.

Banners and partner logos are served from `apps/web/app/catalog-assets/[kind]/[file]/route.ts`. The only directories are `public/events/banners` and `public/partners` in the one-pager. The file name has to stay inside that directory, and the type has to be jpeg, png, or webp.

Interface labels are in `apps/web/src/i18n/copy.ts`. Event titles, artist names, and venue names stay the catalog strings.

Run `pnpm --filter tropical-nomads-shared test` and `pnpm --filter tropical-nomads-web test`. The one-pager `pnpm lint` and `pnpm build` still pass. The web shell is not deployed.

The next ticket must not require a login for this list, take payment here, translate the catalog strings, widen the image route, or remove the one-pager list.

## The list does not sell

People need the seller's link before accounts and payment exist. A checkout button could have been added now, or the link can leave the site. Ticket 13 is the in-app sale. This page only opens an https URL.
