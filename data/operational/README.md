# Operational JSON

This directory is the private store for orders, payment traces, issued tickets, check-ins, door invites, and stock counts. It is not inside `public/`, and the one-pager does not publish it. The committed files are empty. Do not put secrets, ticket values, card numbers, or customer records here.

The API reads and writes these files. A cross-process lock waits on the stack. One process orders its own writes. Two processes can still drop an update.

`MERCH_STOCK` in the one-pager stays until ticket 16. Amazon RDS for PostgreSQL is still only a recommendation.
