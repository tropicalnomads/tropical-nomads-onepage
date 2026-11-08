# Host status

`infra/frankfurt/status` is a local page for the Frankfurt hosts. The browser calls a loopback server, and each Refresh button runs one fixed AWS CLI read in `eu-central-1`. The page does not create or change a resource, and it never reads a secret value.

From the repo root, with `EXPECTED_AWS_ACCOUNT` set to the account that may be read:

`python3 infra/frankfurt/status/server.py`

Open `http://127.0.0.1:8788`. The server refuses a caller that is not the user `tropical-nomads`.

The next change must not bind this page on a public address, accept a command from the browser, or call `get-secret-value`.
