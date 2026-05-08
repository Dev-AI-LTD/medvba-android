# Cognito Migration — Next Steps

Follow these steps in order before going live with Cognito-only auth.

## 1. Deploy the CDK Stack

```bash
cd infra
npm install

# Set social provider credentials
export GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=your_google_client_secret
export FACEBOOK_APP_ID=your_facebook_app_id
export FACEBOOK_APP_SECRET=your_facebook_app_secret
export APPLE_SERVICES_ID=com.devaieood.medvba.auth
export APPLE_TEAM_ID=XXXXXXXXXX
export APPLE_KEY_ID=XXXXXXXXXX
export APPLE_PRIVATE_KEY="$(cat AuthKey_XXXXXXXXXX.p8)"

export COGNITO_DOMAIN_PREFIX=medvba   # must be globally unique in AWS
export ENV_NAME=prod

npx cdk bootstrap   # first time only
npx cdk deploy
```

Copy the 4 stack outputs to `.env` and EAS Secrets:

| CDK Output       | Client env var                      | Backend env var        |
|------------------|-------------------------------------|------------------------|
| UserPoolId       | `EXPO_PUBLIC_COGNITO_USER_POOL_ID`  | `COGNITO_USER_POOL_ID` |
| UserPoolClientId | `EXPO_PUBLIC_COGNITO_APP_CLIENT_ID` | —                      |
| UserPoolDomain   | `EXPO_PUBLIC_COGNITO_DOMAIN`        | —                      |
| Region           | `EXPO_PUBLIC_COGNITO_REGION`        | `COGNITO_REGION`       |

## 2. Configure Social Provider Redirect URIs

Add this URL to each social provider's developer console:

```
https://<COGNITO_DOMAIN_PREFIX>.auth.<REGION>.amazoncognito.com/oauth2/idpresponse
```

- **Google**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client → Authorized redirect URIs
- **Facebook**: [Meta Developer Console](https://developers.facebook.com) → App → Facebook Login → Valid OAuth Redirect URIs
- **Apple**: [Apple Developer](https://developer.apple.com) → Certificates → Service IDs → `com.devaieood.medvba.auth` → Return URLs

## 3. Run Database Migrations

Apply both new migrations to your Supabase instance (via CLI or SQL editor):

```bash
# Option A: Supabase CLI
supabase db push

# Option B: manually in SQL editor — run in order:
# supabase_migrations/037_drop_auth_fk_and_triggers.sql
# supabase_migrations/038_disable_rls_for_cognito.sql
```

These migrations:
- Drop the `profiles.id → auth.users.id` FK (Cognito `sub` values are not in Supabase Auth)
- Remove the auto-create-profile trigger (app handles this via `ensureUserExists`)
- Disable RLS on user-private tables (writes go through tRPC backend with service role key)

> ⚠️ **Important**: Run these migrations before deploying the new app build, or existing
> Supabase-auth users will lose write access to their own data.

## 4. Update EAS Secrets

```bash
# Required Cognito vars (from CDK outputs)
eas env:create --name EXPO_PUBLIC_COGNITO_REGION --value us-east-1 --environment production
eas env:create --name EXPO_PUBLIC_COGNITO_USER_POOL_ID --value us-east-1_XXXXXX --environment production
eas env:create --name EXPO_PUBLIC_COGNITO_APP_CLIENT_ID --value xxxxxxxxxx --environment production
eas env:create --name EXPO_PUBLIC_COGNITO_DOMAIN --value medvba.auth.us-east-1.amazoncognito.com --environment production

# Required backend vars (set on Railway)
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXX
```

## 5. Deploy the Backend

Redeploy the Hono/tRPC backend on Railway with the new `COGNITO_REGION` and
`COGNITO_USER_POOL_ID` env vars set. The backend now only verifies Cognito JWTs —
Supabase JWTs will be rejected.

Verify via the health endpoint:
```bash
curl https://your-backend.up.railway.app/health
# hasCognitoConfig should be true
```

## 6. Run bun/npm install

Remove the three native SDK packages that were deleted from `package.json`:

```bash
bun install
# or: npm install
```

## 7. Rebuild and Test the App

```bash
# Development build (test Cognito flow end-to-end)
eas build --profile development --platform android

# Verify:
# - Email/password sign up (check email for Cognito verification code)
# - Email/password sign in
# - Google social login (Hosted UI opens in browser)
# - Facebook social login
# - Apple social login
# - Password reset (Cognito sends reset code to email)
# - Profile loads correctly after sign in
# - tRPC calls succeed (quiz sessions, progress, etc.)
```

## 8. Handle Existing Users (if applicable)

If there are existing users in **Supabase Auth** who need to continue using the app:

- Their `profiles.id` (Supabase UUID) will NOT match their Cognito `sub`.
- Options:
  1. **Force re-registration**: have users sign up again via Cognito (simplest).
  2. **Import users**: use the Cognito `AdminCreateUser` API to pre-create accounts
     and link their existing profile IDs — requires a one-time migration script.
  3. **Dual-write period**: temporarily keep Supabase Auth active alongside Cognito
     and migrate users gradually.

## 9. Production Build

Once all tests pass:

```bash
eas build --profile production --platform android
eas build --profile production --platform ios
eas submit --platform android
eas submit --platform ios
```
