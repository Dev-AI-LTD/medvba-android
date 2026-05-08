# MEDVBA Cognito CDK Stack

Provisions the AWS Cognito User Pool for MEDVBA with Google, Facebook, and Apple identity providers via the Hosted UI PKCE flow.

## Prerequisites

- AWS CLI configured (`aws configure`)
- Node.js 20+
- CDK bootstrapped in your account/region: `npx cdk bootstrap`

## Deploy

```bash
cd infra
npm install

# Required: social provider credentials
export GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=your_google_client_secret

export FACEBOOK_APP_ID=your_facebook_app_id
export FACEBOOK_APP_SECRET=your_facebook_app_secret

export APPLE_SERVICES_ID=com.devaieood.medvba.auth
export APPLE_TEAM_ID=XXXXXXXXXX
export APPLE_KEY_ID=XXXXXXXXXX
export APPLE_PRIVATE_KEY="$(cat AuthKey_XXXXXXXXXX.p8)"

# Optional: customize domain prefix (must be globally unique in AWS)
export COGNITO_DOMAIN_PREFIX=medvba
export ENV_NAME=prod

npx cdk deploy
```

## After Deploy

Copy the stack outputs to your `.env` (local) and EAS Secrets (CI/production):

| CDK Output       | Client env var                        | Backend env var           |
|------------------|---------------------------------------|---------------------------|
| UserPoolId       | `EXPO_PUBLIC_COGNITO_USER_POOL_ID`    | `COGNITO_USER_POOL_ID`    |
| UserPoolClientId | `EXPO_PUBLIC_COGNITO_APP_CLIENT_ID`   | —                         |
| UserPoolDomain   | `EXPO_PUBLIC_COGNITO_DOMAIN`          | —                         |
| Region           | `EXPO_PUBLIC_COGNITO_REGION`          | `COGNITO_REGION`          |

## Social Provider Redirect URI

For each social provider, add the Cognito OAuth2 redirect URI to their developer console:

```
https://<COGNITO_DOMAIN_PREFIX>.auth.<REGION>.amazoncognito.com/oauth2/idpresponse
```

- **Google**: Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs
- **Facebook**: Meta Developer → App → Facebook Login → Valid OAuth Redirect URIs
- **Apple**: Apple Developer → Certificates → Service IDs → your Services ID → Return URLs

## Database Migrations

After deploying Cognito, run these migrations against your Supabase instance:

```bash
# Run via Supabase CLI or SQL editor
supabase db push  # or apply manually:
# 037_drop_auth_fk_and_triggers.sql
# 038_disable_rls_for_cognito.sql
```

These migrations:
1. Drop the `profiles.id → auth.users.id` FK (Cognito `sub` values aren't in Supabase Auth)
2. Disable RLS on user-private tables (writes go through tRPC backend with service role key)

## Useful CDK Commands

```bash
npx cdk diff     # Preview changes before deploy
npx cdk synth    # Print the CloudFormation template
npx cdk destroy  # Tear down (User Pool is RETAIN policy — manual deletion required)
```
