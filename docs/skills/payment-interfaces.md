# Payment interfaces

Ticket 12. The functions live in `apps/api/src/payments.ts`. Traces stay in `data/operational/payment-traces.json`. Methods stay on the profile file. The account screen is `apps/web/src/components/PaymentSection.tsx`. `startTicketPaymentAction` and `startShopPaymentAction` are the app calls. Both end in `startPayment`.

A trace is stored as `pending_provider`. A status on the call is ignored. `markPaymentConfirmed` does not write, and the web app does not import it. `recordRefund` does not write. A method keeps the last 4 digits, never a card number or a CVC. The currency argument is stored as sent. An admin sees every trace on `/account` through `adminTraceRows`. A user sees only their own. Door cannot. The row shows the username, not the subject. Upcoming events stay public. The one-pager still links out for tickets and shop.

Run `pnpm --filter tropical-nomads-api test` and `pnpm --filter tropical-nomads-web test`. The one-pager `pnpm lint` and `pnpm build` still pass. The web shell is not deployed.

The next ticket must not mark a trace confirmed from the app, store a card number, name a payment company, or replace the Eventbrite and WhatsApp links.

## No company is connected

The ticket asks for payment functions now and the company in a later ticket. A provider SDK could have been installed, or a full card number could have been stored for that later charge. The owner said not to pick a company, and a card number in JSON is rejected by the schema. The stub records a pending trace and the last 4 digits.
