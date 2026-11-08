# Cognito

The web app user pool is `tropical-nomads-web` in Frankfurt. The app client has the same name, has no client secret, and signs in with email using SRP. The groups are `admin`, `door`, and `user`.

The template is `infra/frankfurt/cognito-user-pool.yaml`. Google and Apple resources, the hosted domain, and the callback URL are parameters. Their defaults are empty, so a deploy with no parameters leaves email sign-in only. Do not write a client secret or an Apple key into git.

The app reads `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_HOSTED_DOMAIN`, and `COGNITO_REDIRECT_URI`. The region stays `eu-central-1`. Google and Apple buttons stay off unless those providers are configured outside this repo. The password sign-in checks the ID token signature, issuer, audience, and verified email, writes the profile, then sets `tn:account:v1`. The hosted callback does the same and also checks the nonce. A password is not stored. A subject from the browser is rejected.

The template is `infra/frankfurt/cognito-user-pool.yaml`. Email sign-in uses `USER_PASSWORD_AUTH`. Passwords stay in Cognito. The web app reads `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` from the environment. Google and Apple are not configured. Do not write a client secret into git.

The next change must not add a fourth group or store a password.
