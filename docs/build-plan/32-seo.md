# 32 — Search and tab logo

**Status:** not started. Step 32. `apps/web` gains the tab logo and the search files the live one-pager already publishes. This file does not implement them. www stays the one-pager. `master` stays untouched.

## Outcome

The web app served at `https://dev.tropical-nomads.com` is searchable in the same way as [www.tropical-nomads.com](https://www.tropical-nomads.com). Public pages carry the one-pager's tab icons, title, description, canonical URL, Open Graph and Twitter cards, sitemap, robots rules, and structured data, plus hreflang for English and Portuguese, plus `/llms.txt`.

The origin on every public search URL is `https://dev.tropical-nomads.com`. The one-pager keeps `https://www.tropical-nomads.com`. This ticket does not point either host at the other.

`apps/web/app/layout.tsx` today sets the title `Tropical Nomads`, the description `Tropical Nomads. Psytrance with a Brazilian touch.`, and `robots: { index: false, follow: false }`. Those three metadata fields are the gap. The visible tagline in `apps/web/src/i18n/copy.ts` and the hero paragraph in `apps/web/src/i18n/home.ts` stay as they are.

## Why it exists

The one-pager already tells browsers and crawlers what the site is. The web app is the new public product and is served at `https://dev.tropical-nomads.com`. Its root layout asks crawlers not to index it, and it has no tab icon, sitemap, robots file, structured data, hreflang, or `/llms.txt`.

`/llms.txt` is the AI-search file. The proposal is at [llmstxt.org](https://llmstxt.org/). It is a Markdown file at the site root. An agent reads it on demand. It is not a robots file and it is not a sitemap. The one-pager does not publish one.

## Depends on

- [03 — Deployment change](03-deployment-change.md). www publishes the one-pager. This ticket does not retarget www.
- [05 — Web app repository](05-app-repos.md). The shell is `apps/web`.
- [08 — Upcoming events](08-upcoming-events.md). The public event list is the source for the event structured data.
- [09 — Security baseline](09-security-baseline.md). Signed-in people stay admin, door, or user. Search files do not grant access.
- [15 — Merch store](15-merch-store.md). `/merch` is a public page.
- [20 — English and Portuguese](20-internationalization.md). The codes stay `en` and `pt`.

Bookings, the payment company, the host tickets, and the native repositories are not prerequisites. The index lists this ticket at step 32 because the file id is 32.

## Rules

- Security is a requirement. `robots.txt` is a crawler preference. Session checks and `decideAccess` stay the lock. A denied role still gets none of the account, ticket, or check-in tools.
- The search files contain no password, session cookie, Cognito secret, connection string, account id, card number, QR payload, buyer email, or operational record. `data/operational` stays unpublished.
- Copy the one-pager's words. Do not write a new title, description, keyword, social card, or event name. Party records come from the published events the web catalog already loads.
- Leave `apps/one-pager` behavior as it is. Leave `amplify.yml` as it is. Leave `master` as it is.
- The host string is `https://dev.tropical-nomads.com`. It is not a secret and it is not read from a new environment variable.

## Copy to reuse

These strings are already in `apps/one-pager/index.html`. Public pages on `apps/web` use them in both languages. There is no Portuguese search sentence in the repo, so this ticket does not add one. The page body keeps the existing `en` and `pt` dictionaries.

Document title:

```
Tropical Nomads | Psytrance Events
```

Meta description:

```
Tropical Nomads brings psytrance events across Europe. Get tickets for upcoming parties and revisit past gatherings in Dublin, Amsterdam, Berlin, London and Lisbon.
```

Keywords, one string:

```
tropical nomads, tropical groove, tropical groove dublin, burn in noise, burn in noise dublin, burn in noise amsterdam, avan7, dj paula, psytrance dublin, psytrance ireland, psytrance amsterdam, psytrance berlin, psytrance lisbon, psytrance london, psytrance events, psytrance party, techno dublin, house dublin, the bernard shaw, the sound house dublin, m-bia berlin, toekomstmuziek amsterdam, dublin rave, dublin psytrance party, pre halloween party dublin, spring awakening dublin, pre st patrick psytrance, psychedelic party, full-on, hi-tech, dark psytrance, progressive psytrance, goa trance, psychedelic grateful punks, psy groove, after june, tropical nomads events, tropical nomads dublin, tropical nomads amsterdam, tropical nomads berlin, festival timetable, tickets psytrance dublin
```

Also copy `author` `Tropical Nomads` and `application-name` `Tropical Nomads`.

Open Graph title, and the Twitter title:

```
Tropical Nomads | Psytrance Events Across Europe
```

Open Graph description:

```
Tropical Groove, Burn in Noise, Avan7, DJ Paula and more. Tickets for upcoming psytrance parties and a look back at past gatherings in Dublin, Amsterdam, Berlin, London and Lisbon.
```

Twitter description:

```
Tropical Groove, Burn in Noise, Avan7, DJ Paula and more. Tickets for upcoming psytrance parties and past gatherings.
```

Image alt, for Open Graph and Twitter:

```
Tropical Nomads - psytrance events across Europe
```

WebSite structured-data description:

```
Psytrance, techno and house events across Europe - Tropical Groove, Burn in Noise and more.
```

ItemList name: `Tropical Nomads Events`. Manifest name `Tropical Nomads Events`, short name `TN Events`, description `Tropical Nomads events page with upcoming and past gatherings.` Theme color and manifest background `#042f2e`. Apple web-app title `Tropical Nomads`.

## To-do

### 1. Tab logo

The one-pager already links `/favicon.ico`, `/favicon-16x16.png`, `/favicon-32x32.png`, and `/apple-touch-icon.png` (180×180) from `apps/one-pager/index.html`. It sets `theme-color` to `#042f2e`, `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` `black-translucent`, and `apple-mobile-web-app-title`. It links `/manifest.webmanifest`. That manifest is generated by the Vite PWA plugin in `apps/one-pager/vite.config.ts`, with the name, short name, description, colors, `display: standalone`, `orientation: portrait`, `scope: /`, and `start_url: /?source=pwa`. The icon files are `icons/icon-192.png`, `icons/icon-512.png`, `icons/maskable-192.png`, and `icons/maskable-512.png`, purposes `any` and `maskable` as the plugin already declares. `apps/web/public/branding` is already a symlink to the one-pager branding directory. The favicon files and `og-image.png` are not behind that symlink.

`apps/web` must serve those existing icon files, `og-image.png`, and a manifest with those same values, and the layout must link them. Serve the existing bytes. A symlink beside the branding symlink is enough. The home canonical stays free of `source=pwa`. This ticket adds no service worker and does not edit the Vite plugin.

### 2. Title and description

The one-pager publishes the document title, meta description, keywords, author, and application name quoted above. Public HTML also sets `robots` and `googlebot` to `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.

`apps/web` must put those strings and those two robots directives on `/`, `/upcoming-events`, and `/merch`. `/`, `/upcoming-events`, and `/merch` share that title and description because the one-pager has no separate title for those routes. The root layout's `noindex` must not remain on those pages.

`/account`, `/account/sign-in`, `/account/register`, `/my-tickets`, and `/check-in` keep `noindex, nofollow`. The route handlers `/health`, `/account/callback`, and `/account/avatar` send `X-Robots-Tag: noindex, nofollow`. `/catalog-assets` stays available so public event images can be fetched.

### 3. Canonical URL

The one-pager home canonical is `https://www.tropical-nomads.com/`. The privacy page canonical is `https://www.tropical-nomads.com/privacy`. `apps/web` has no privacy route.

On `apps/web`, the English canonical of a public page is the absolute URL on `https://dev.tropical-nomads.com` with no query and no fragment: `https://dev.tropical-nomads.com/`, `https://dev.tropical-nomads.com/upcoming-events`, and `https://dev.tropical-nomads.com/merch`. `?lang=en` canonicalizes to that clean URL. The Portuguese canonical is the same path plus `?lang=pt`. Any other `lang` value is English. Canonicals omit session, `source`, and other parameters. Open Graph `og:url` uses the same canonical. Private and noindex routes are omitted from the sitemap and from `/llms.txt`.

### 4. Open Graph and Twitter cards

The one-pager sets `og:type` `website`, `og:site_name` `Tropical Nomads`, `og:locale` `en_US`, `og:locale:alternate` `pt_BR`, and `og:url` to the www canonical. The image is `https://www.tropical-nomads.com/og-image.png`, also as `og:image:secure_url`, type `image/png`, width `1200`, height `630`, with the alt above. Twitter uses `summary_large_image`, the Twitter title and description above, the same image and alt, and `twitter:site` `@tropicalnomads.events`. That handle is the one already in `apps/one-pager/public/data/socials.json`.

`apps/web` must publish the same card with the image URL `https://dev.tropical-nomads.com/og-image.png`. An English page uses `og:locale` `en_US` and `og:locale:alternate` `pt_BR`. A Portuguese page uses `og:locale` `pt_BR` and `og:locale:alternate` `en_US`. The card text stays the English strings in "Copy to reuse".

### 5. Sitemap

The one-pager sitemap lists four locs: `/` daily `1.0`, `/privacy/` yearly `0.4`, `/#upcoming-events` daily `0.9`, and `/#gallery` weekly `0.7`. The web homepage already has `id="upcoming-events"` and `id="gallery"`.

`apps/web` must publish `https://dev.tropical-nomads.com/sitemap.xml` with:

| Loc | changefreq | priority |
| --- | --- | --- |
| `https://dev.tropical-nomads.com/` | daily | 1.0 |
| `https://dev.tropical-nomads.com/?lang=pt` | daily | 1.0 |
| `https://dev.tropical-nomads.com/upcoming-events` | daily | 0.9 |
| `https://dev.tropical-nomads.com/upcoming-events?lang=pt` | daily | 0.9 |
| `https://dev.tropical-nomads.com/merch` | weekly | 0.7 |
| `https://dev.tropical-nomads.com/merch?lang=pt` | weekly | 0.7 |
| `https://dev.tropical-nomads.com/#upcoming-events` | daily | 0.9 |
| `https://dev.tropical-nomads.com/#gallery` | weekly | 0.7 |

Daily `0.9` is the one-pager's upcoming-events figure. Weekly `0.7` is the gallery figure, reused for `/merch` because the one-pager has no merch loc and this ticket adds no new scale. Each loc carries `xhtml:link` alternates for `en`, `pt`, and `x-default` pointing at that page's English and Portuguese canonicals. The fragment locs use the home page's alternates. The privacy loc stays on the one-pager only. Account, tickets, check-in, health, and callback URLs stay out.

### 6. Robots

The one-pager `apps/one-pager/public/robots.txt` allows `/` for `*`, `Googlebot`, `Bingbot`, `Twitterbot`, `facebookexternalhit`, and `WhatsApp`, and points the sitemap at `https://www.tropical-nomads.com/sitemap.xml`. It names no AI crawler. The `*` group already allows them. The one-pager has no account, ticket, check-in, or health route.

`apps/web` must publish `/robots.txt` that keeps those crawlers and adds the AI crawler tokens their providers document:

- OpenAI, [Overview of OpenAI Crawlers](https://developers.openai.com/api/docs/bots): `OAI-SearchBot` (ChatGPT search), `GPTBot` (foundation-model training), `ChatGPT-User` (user-initiated fetches; OpenAI says robots rules may not apply to those).
- Anthropic, [Does Anthropic crawl data from the web](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler): `ClaudeBot` (training), `Claude-SearchBot` (search), `Claude-User` (user-initiated fetches).
- Google, [common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers): `Google-Extended`. Google says this token does not change Google Search inclusion. `Googlebot` is already named above.
- Perplexity, [Perplexity Crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers): `PerplexityBot` (search results, not foundation-model training) and `Perplexity-User`.

A named group does not inherit `User-agent: *`. Every group, including `*`, allows `/` and disallows `/account`, `/my-tickets`, `/check-in`, and `/health`. The sitemap line is `Sitemap: https://dev.tropical-nomads.com/sitemap.xml`. Add a further token only when that provider's documentation names it. `robots.txt` does not replace the noindex tags or the role checks.

### 7. Structured data

The one-pager home embeds a schema.org `@graph` with `Organization` `@id` `https://www.tropical-nomads.com/#organization` and `WebSite` `@id` `https://www.tropical-nomads.com/#website`. The organization name is `Tropical Nomads`, the logo is `https://www.tropical-nomads.com/branding/tropical-nomads-logo-horizontal-clean.png`, the image is the og image, and `sameAs` is exactly:

- `https://www.instagram.com/tropicalnomads.events/`
- `https://www.instagram.com/tropicalnomadsbookings/`
- `https://bookings.tropical-nomads.com/`

`socials.json` also lists Psy Groove and Facebook. Those URLs are not in this `sameAs` list, and this ticket does not add them. The WebSite `inLanguage` array is `["en", "pt"]`. The publisher points at the organization `@id`. The description is the WebSite sentence above.

`apps/one-pager/vite.config.ts` `buildEventsJsonLd` injects a second script at `<!-- @events-jsonld -->`: an `ItemList` named `Tropical Nomads Events`. Each published event with `dateStart` becomes a `ListItem` whose item is a `MusicEvent`: `name`, `startDate`, `eventStatus` `https://schema.org/EventScheduled`, `eventAttendanceMode` `https://schema.org/OfflineEventAttendanceMode`, a `Place` named from the venue name or the city, and a `PostalAddress` with `addressLocality` and `addressCountry`. It adds `endDate` when `dateEnd` is present, `image` from the banner or full image (absolute on the site origin when the path is relative), `url` from the first present link among tickets, Eventbrite, the Instagram post, and Goabase, and `performer` `MusicGroup` entries from `cardArtists` when that list is non-empty. The organizer is `Tropical Nomads` with the site origin. Events without `dateStart` are skipped.

`apps/web` must emit those two graphs on the public home page. `@id`, `url`, logo, and image use `https://dev.tropical-nomads.com`. Event fields come from the published records the web catalog already loads, with the same omissions the plugin uses. The web catalog's `ticketUrl`, then `instagramPost`, then `goabaseUrl`, is the link order when the catalog has already collapsed the published links. Do not add stages, photos, videos, sets, street addresses, prices, or a party that is not in that published list. Leave the Vite plugin unchanged.

### 8. Hreflang for English and Portuguese

The one-pager sets `<html lang="en">`, Open Graph `en_US` with alternate `pt_BR`, and WebSite `inLanguage` `["en", "pt"]`. It does not emit `<link rel="alternate" hreflang>`. The language switch does not change the URL. Ticket 20 stores the web choice at `tn:language:v1` and keeps the codes `en` and `pt`. Unrecognized values select English. `apps/web/app/layout.tsx` currently hardcodes `lang="en"`, and `LanguageProvider` applies the stored language after hydration.

`apps/web` must give each public language its own URL, because hreflang needs a distinct URL per language. English and `x-default` use the clean canonical. Portuguese uses `?lang=pt` on that same path. The server HTML for a public page is already in that language, from the existing dictionaries, and `<html lang>` is `en` or `pt` to match. Each public page emits reciprocal alternates for `en`, `pt`, and `x-default`. Noindex pages emit none. The switch still stores `tn:language:v1`. A third language is out of scope. Hreflang codes stay `en` and `pt`. Open Graph keeps `en_US` and `pt_BR`.

### 9. AI-search file

The one-pager has no `/llms.txt`. Current practice is the file specified at [llmstxt.org](https://llmstxt.org/): Markdown at `/llms.txt`, an H1 with the site name, a blockquote summary, optional paragraphs that are not headings, then H2 sections of links in the form `[name](url): notes`. An `Optional` section is the convention for secondary links. The file is for agents at inference time. `robots.txt` remains the crawl preference.

`apps/web` must serve `https://dev.tropical-nomads.com/llms.txt` as `text/plain; charset=utf-8`, with this body and no extra parties or sentences:

```
# Tropical Nomads

> Tropical Nomads brings psytrance events across Europe. Get tickets for upcoming parties and revisit past gatherings in Dublin, Amsterdam, Berlin, London and Lisbon.

English is `en`. Portuguese is `pt` on the same path with `?lang=pt`. Party names, dates, and venues are the published event records on the pages below.

## Pages

- [Tropical Nomads](https://dev.tropical-nomads.com/)
- [Tropical Nomads](https://dev.tropical-nomads.com/?lang=pt)
- [Upcoming events](https://dev.tropical-nomads.com/upcoming-events)
- [Upcoming events](https://dev.tropical-nomads.com/upcoming-events?lang=pt)
- [Merch](https://dev.tropical-nomads.com/merch)
- [Merch](https://dev.tropical-nomads.com/merch?lang=pt)

## Optional

- [Tropical Nomads on Instagram](https://www.instagram.com/tropicalnomads.events/)
- [tropicalnomadsbookings](https://www.instagram.com/tropicalnomadsbookings/)
- [Bookings](https://bookings.tropical-nomads.com/)
```

`Upcoming events` and `Merch` are the labels already in `packages/shared/src/navigation/areas.ts`. `Tropical Nomads on Instagram` is the label in `apps/one-pager/public/data/socials.json`. `Bookings` is the existing header link. `tropicalnomadsbookings` is the path of the second `sameAs` URL, which has no separate label in the repo. This ticket adds `/llms.txt` only.

## Acceptance criteria

- The build-plan index lists this ticket at step 32, depending on tickets 03, 05, 08, 09, 15, and 20.
- Public pages on `apps/web` serve the tab icons, manifest, theme color, and the copied title, description, keywords, canonical, Open Graph, and Twitter card. The image and logo URLs use `https://dev.tropical-nomads.com`.
- `/sitemap.xml`, `/robots.txt`, and `/llms.txt` match the lists in this ticket. Named robots groups repeat the private disallows. AI crawler tokens are only the ones named above.
- The home page emits the Organization, WebSite, and event ItemList graphs from published events, on the dev origin.
- Public pages emit hreflang for `en`, `pt`, and `x-default`. The server HTML language matches. No third language was added.
- `/account`, `/my-tickets`, `/check-in`, and `/health` stay out of the sitemap and `/llms.txt`, and stay `noindex`. Role checks are unchanged.
- The search files contain none of the secrets named in the rules.
- `apps/one-pager` is unchanged, including `index.html`, `public/robots.txt`, `public/sitemap.xml`, and `vite.config.ts`. www is still the one-pager. `amplify.yml` is unchanged. Nothing in this ticket was deployed by writing the ticket.

## Tests

`pnpm --filter tropical-nomads-web test` covers the public strings, the dev canonicals, the private noindex paths, the robots groups, the sitemap locs, the `/llms.txt` body, and the structured-data mapping. A fixture event without `dateStart` is absent. A fixture event with `dateStart` keeps the plugin's fields and adds no party of its own.

The one-pager `pnpm lint` and `pnpm build` still pass. A test that passed before this ticket still passes.
