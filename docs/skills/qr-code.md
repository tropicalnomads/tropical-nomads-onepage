# QR code

The door code is an SVG of the shared payload `{"id","secret"}` from `qrPayloadText`. The encoder is the `qrcode` package in `apps/web`, used by `apps/web/src/tickets/qr.ts`. It is not a payment SDK. The drawing is at least 240px on a side, ink on cream. The accessible name does not include the secret.

The secret is generated in `createTicketSecret` with `randomBytes`. It is stored only on the issued ticket. It is not the public party id.

The next ticket must not put that secret in a URL, in `public/data`, or in a marketing message.
