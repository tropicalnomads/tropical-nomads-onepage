# Cognito

The web app user pool is `tropical-nomads-web` in Frankfurt. The app client has the same name, has no client secret, and signs in with email using SRP. The groups are `admin`, `door`, and `user`. Google and Apple are not configured.

The template is `infra/frankfurt/cognito-user-pool.yaml`. Passwords stay in Cognito. Do not add a provider until the owner's client id is available, and do not write that secret into git.

The next change must not add a fourth group or store a password.
