import * as cdk from 'aws-cdk-lib';
import { MedvbaCognitoStack } from './cognito-stack';

const app = new cdk.App();

new MedvbaCognitoStack(app, 'MedvbaCognito', {
  envName: process.env.ENV_NAME ?? 'prod',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  domainPrefix: process.env.COGNITO_DOMAIN_PREFIX ?? 'medvba',

  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: cdk.SecretValue.unsafePlainText(process.env.GOOGLE_CLIENT_SECRET ?? ''),

  facebookAppId: process.env.FACEBOOK_APP_ID ?? '',
  facebookAppSecret: cdk.SecretValue.unsafePlainText(process.env.FACEBOOK_APP_SECRET ?? ''),

  appleServicesId: process.env.APPLE_SERVICES_ID ?? 'com.devaieood.medvba.auth',
  appleTeamId: process.env.APPLE_TEAM_ID ?? '',
  appleKeyId: process.env.APPLE_KEY_ID ?? '',
  applePrivateKey: cdk.SecretValue.unsafePlainText(process.env.APPLE_PRIVATE_KEY ?? ''),
});
