## Tropical Nomads Page

Single Next.js app that serves both:

- `events.tropical-nomads.com` (events site)
- `bookings.tropical-nomads.com` (booking agency site)

Subdomains are handled by middleware and local development supports:

- `events.localhost:3000`
- `bookings.localhost:3000`

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Visit:

- [http://events.localhost:3000](http://events.localhost:3000)
- [http://bookings.localhost:3000](http://bookings.localhost:3000)

## Environment

Create `.env.local` from `.env.local.example` and set:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GA_ID`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`

## Commands

- `npm run dev`
- `npm run lint`
- `npm run type-check`
- `npm run build`
