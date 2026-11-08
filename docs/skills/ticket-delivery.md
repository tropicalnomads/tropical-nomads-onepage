# Ticket delivery

Use this on every Tropical Nomads implementation ticket. The Project coordinator runs the sequence. Do not skip a role, and do not start implementation until the owner asks for that ticket.

## When

A build-plan ticket is accepted for implementation.

## Result

One pull request for that ticket, reviewed in this order: product manager, technical lead, developer, QA. The owner reviews only after QA.

## Order

1. Product manager confirms the outcome, what is out of scope, and that the ticket order still makes sense.
2. Technical lead chooses the approach and the limits. The current site keeps deploying. The new app does not go live until a ticket explicitly says so.
3. Developer implements only that ticket.
4. QA tests what the ticket asked for and sends failures back to the developer before the owner is asked to review.

## Exceptions

- Planning, docs, and questions do not start this sequence.
- A role that finds the ticket blocked stops and tells the coordinator. The coordinator asks the owner.
- The coordinator does not implement the ticket herself.

## Checks

- The pull request matches one ticket.
- QA ran against that ticket’s to-do list.
- The live one-pager behavior is unchanged unless the ticket is about the current site.

## References

- Build tickets live in `docs/build-plan/` on the planning pull request.
- Owner lean, not a lock: Next.js for the app (web, iOS, Android); AWS for backend, data, and hosting; domain already on AWS.
