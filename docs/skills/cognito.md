# Cognito

The web app user pool is `tropical-nomads-web` in Frankfurt. The app client has the same name, has no client secret, and signs in with email using SRP. The groups are `admin`, `door`, and `user`. Google and Apple are not configured.

The template is `infra/frankfurt/cognito-user-pool.yaml`. Email sign-in uses `USER_PASSWORD_AUTH`. Passwords stay in Cognito. The web app reads `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` from the environment. Google and Apple are not configured. Do not write a client secret into git.

The next change must not add a fourth group or store a password.
