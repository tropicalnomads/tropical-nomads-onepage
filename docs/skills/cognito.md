# Cognito

The web app user pool is `tropical-nomads-web` in Frankfurt. The app client has the same name, has no client secret, and signs in with email using SRP. The groups are `admin`, `door`, and `user`.

The template is `infra/frankfurt/cognito-user-pool.yaml`. Google and Apple resources, the hosted domain, and the callback URL are parameters. Their defaults are empty, so a deploy with no parameters leaves email sign-in only. Do not write a client secret or an Apple key into git.

The app reads `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_HOSTED_DOMAIN`, and `COGNITO_REDIRECT_URI`. The region stays `eu-central-1`. `COGNITO_GOOGLE=true` or `COGNITO_APPLE=true` turns on that button. The redirect is PKCE. The callback checks the ID token signature, issuer, audience, nonce, and verified email, then sets `tn:account:v1`. A password is not stored. A subject from the browser is rejected.

The next change must not add a fourth group or store a password.
