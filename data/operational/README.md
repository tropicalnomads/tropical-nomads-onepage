# Operational JSON

This directory is the private store for orders, payment traces, issued tickets, check-ins, door invites, guest lists, stock counts, and profiles. Payment methods are fields on `profiles.json`, not a separate public file. It is not inside `public/`, and the one-pager does not publish it. The committed files are empty. Do not commit customer records. Do not put secrets, passwords, ticket values, or card numbers here.

The API reads and writes these files. A cross-process lock waits on the stack. One process orders its own writes. Two processes can still drop an update.

`SHOP_STOCK` in the one-pager stays until ticket 16. Amazon RDS for PostgreSQL is still only a recommendation.
