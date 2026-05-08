import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface MedvbaCognitoStackProps extends cdk.StackProps {
  /** e.g. "prod" or "dev" */
  envName: string;
  /** Google OAuth Client ID from Google Cloud Console */
  googleClientId: string;
  /** Google OAuth Client Secret from Google Cloud Console */
  googleClientSecret: cdk.SecretValue;
  /** Facebook App ID from Meta Developer Console */
  facebookAppId: string;
  /** Facebook App Secret from Meta Developer Console */
  facebookAppSecret: cdk.SecretValue;
  /** Apple Services ID (e.g. com.devaieood.medvba.auth) */
  appleServicesId: string;
  /** Apple Team ID */
  appleTeamId: string;
  /** Apple Key ID for Sign In with Apple */
  appleKeyId: string;
  /** Apple private key content (p8 file contents) */
  applePrivateKey: cdk.SecretValue;
  /** Cognito Hosted UI domain prefix (must be globally unique) */
  domainPrefix: string;
}

export class MedvbaCognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, props: MedvbaCognitoStackProps) {
    super(scope, id, props);

    // -------------------------------------------------------------------------
    // User Pool
    // -------------------------------------------------------------------------
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `medvba-${props.envName}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      email: cognito.UserPoolEmail.withCognito(),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // -------------------------------------------------------------------------
    // Identity Providers
    // -------------------------------------------------------------------------
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
      userPool: this.userPool,
      clientId: props.googleClientId,
      clientSecretValue: props.googleClientSecret,
      scopes: ['email', 'profile', 'openid'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        fullname: cognito.ProviderAttribute.GOOGLE_NAME,
        profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
      },
    });

    const facebookProvider = new cognito.UserPoolIdentityProviderFacebook(this, 'FacebookProvider', {
      userPool: this.userPool,
      clientId: props.facebookAppId,
      clientSecret: props.facebookAppSecret.unsafeUnwrap(),
      scopes: ['email', 'public_profile'],
      apiVersion: 'v18.0',
      attributeMapping: {
        email: cognito.ProviderAttribute.FACEBOOK_EMAIL,
        fullname: cognito.ProviderAttribute.FACEBOOK_NAME,
      },
    });

    const appleProvider = new cognito.UserPoolIdentityProviderApple(this, 'AppleProvider', {
      userPool: this.userPool,
      clientId: props.appleServicesId,
      teamId: props.appleTeamId,
      keyId: props.appleKeyId,
      privateKey: props.applePrivateKey.unsafeUnwrap(),
      scopes: ['email', 'name'],
      attributeMapping: {
        email: cognito.ProviderAttribute.APPLE_EMAIL,
        fullname: cognito.ProviderAttribute.APPLE_NAME,
      },
    });

    // -------------------------------------------------------------------------
    // App Client
    // -------------------------------------------------------------------------
    this.userPoolClient = new cognito.UserPoolClient(this, 'AppClient', {
      userPool: this.userPool,
      userPoolClientName: `medvba-${props.envName}-mobile`,
      generateSecret: false, // public client (mobile app)
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: false,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ['medvba://auth/cognito-callback'],
        logoutUrls: ['medvba://auth/cognito-callback'],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.FACEBOOK,
        cognito.UserPoolClientIdentityProvider.APPLE,
      ],
    });

    // Ensure identity providers are created before the client
    this.userPoolClient.node.addDependency(googleProvider);
    this.userPoolClient.node.addDependency(facebookProvider);
    this.userPoolClient.node.addDependency(appleProvider);

    // -------------------------------------------------------------------------
    // Hosted UI Domain
    // -------------------------------------------------------------------------
    this.userPoolDomain = new cognito.UserPoolDomain(this, 'Domain', {
      userPool: this.userPool,
      cognitoDomain: { domainPrefix: props.domainPrefix },
    });

    // -------------------------------------------------------------------------
    // Outputs — copy these to .env and EAS Secrets after deploy
    // -------------------------------------------------------------------------
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Set as EXPO_PUBLIC_COGNITO_USER_POOL_ID (client) and COGNITO_USER_POOL_ID (backend)',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Set as EXPO_PUBLIC_COGNITO_APP_CLIENT_ID',
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: `${props.domainPrefix}.auth.${this.region}.amazoncognito.com`,
      description: 'Set as EXPO_PUBLIC_COGNITO_DOMAIN',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Set as EXPO_PUBLIC_COGNITO_REGION (client) and COGNITO_REGION (backend)',
    });
  }
}
