/**
 * lib/cognito.ts — AWS Cognito auth client
 *
 * Provides email/password auth via the Cognito REST API (no SDK dependency)
 * and social login (Google, Facebook, Apple) via the Cognito Hosted UI PKCE
 * flow using expo-web-browser.
 *
 * Token storage: same SecureStore adapter used by the Supabase client.
 *
 * Required env vars (client):
 *   EXPO_PUBLIC_COGNITO_USER_POOL_ID    e.g. us-east-1_AbCdEfGhI
 *   EXPO_PUBLIC_COGNITO_APP_CLIENT_ID   the app client (no secret)
 *   EXPO_PUBLIC_COGNITO_REGION          e.g. us-east-1
 *   EXPO_PUBLIC_COGNITO_DOMAIN          e.g. medvba.auth.us-east-1.amazoncognito.com
 *
 * Deep-link callback: medvba://auth/cognito-callback  (register in Cognito App Client)
 */

import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const extra = Constants.expoConfig?.extra ?? {};

function cfg(key: string): string {
  return (
    (process.env as Record<string, string | undefined>)[key] ||
    (extra as Record<string, string | undefined>)[key] ||
    ''
  );
}

export const cognitoConfig = {
  get userPoolId() { return cfg('EXPO_PUBLIC_COGNITO_USER_POOL_ID'); },
  get appClientId() { return cfg('EXPO_PUBLIC_COGNITO_APP_CLIENT_ID'); },
  get region() { return cfg('EXPO_PUBLIC_COGNITO_REGION'); },
  get domain() { return cfg('EXPO_PUBLIC_COGNITO_DOMAIN'); },
};

export const isCognitoConfigured = (): boolean =>
  Boolean(
    cognitoConfig.userPoolId &&
    cognitoConfig.appClientId &&
    cognitoConfig.region
  );

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CognitoTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  /** Unix timestamp (seconds) when the access/id tokens expire. */
  expiresAt: number;
}

export interface CognitoUser {
  /** Cognito `sub` — stable UUID for this user across all sign-in methods. */
  sub: string;
  email: string;
  name?: string;
}

export interface CognitoSession {
  user: CognitoUser;
  tokens: CognitoTokens;
}

// ---------------------------------------------------------------------------
// SecureStore helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@medvba_cognito_tokens';

async function storeTokens(tokens: CognitoTokens): Promise<void> {
  const json = JSON.stringify(tokens);
  if (Platform.OS === 'web') {
    try { localStorage.setItem(STORAGE_KEY, json); } catch {}
  } else {
    await SecureStore.setItemAsync(STORAGE_KEY, json);
  }
}

async function loadTokens(): Promise<CognitoTokens | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(STORAGE_KEY)
        : await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CognitoTokens;
  } catch {
    return null;
  }
}

async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// JWT decode (no verification — tokens are already verified server-side)
// ---------------------------------------------------------------------------

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  try {
    const part = jwt.split('.')[1];
    const padded = part + '='.repeat((4 - (part.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

function extractUser(idToken: string): CognitoUser {
  const p = decodeJwtPayload(idToken);
  return {
    sub: String(p.sub ?? ''),
    email: String(p.email ?? ''),
    name: p.name ? String(p.name) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Cognito REST API helpers (USER_PASSWORD_AUTH and token endpoint)
// ---------------------------------------------------------------------------

type CognitoTarget =
  | 'AmazonCognitoIdentityProviderService.InitiateAuth'
  | 'AmazonCognitoIdentityProviderService.SignUp'
  | 'AmazonCognitoIdentityProviderService.ConfirmSignUp'
  | 'AmazonCognitoIdentityProviderService.ForgotPassword'
  | 'AmazonCognitoIdentityProviderService.ConfirmForgotPassword'
  | 'AmazonCognitoIdentityProviderService.GlobalSignOut'
  | 'AmazonCognitoIdentityProviderService.RespondToAuthChallenge';

async function callCognito(target: CognitoTarget, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { region } = cognitoConfig;
  const url = `https://cognito-idp.${region}.amazonaws.com/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': target,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    const code = String(data.__type ?? data.code ?? 'CognitoError');
    const message = String(data.message ?? 'Cognito request failed');
    throw new CognitoError(code, message);
  }
  return data;
}

export class CognitoError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'CognitoError';
  }
}

function parseAuthResult(authResult: Record<string, unknown>): CognitoTokens {
  const r = authResult as {
    IdToken: string;
    AccessToken: string;
    RefreshToken?: string;
    ExpiresIn: number;
  };
  return {
    idToken: r.IdToken,
    accessToken: r.AccessToken,
    refreshToken: r.RefreshToken ?? '',
    expiresAt: Math.floor(Date.now() / 1000) + (r.ExpiresIn ?? 3600),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sign in with email and password.
 * Uses USER_PASSWORD_AUTH flow — ensure the Cognito app client has this
 * flow enabled (Auth flows → ALLOW_USER_PASSWORD_AUTH).
 */
export async function cognitoSignIn(email: string, password: string): Promise<CognitoSession> {
  const data = await callCognito('AmazonCognitoIdentityProviderService.InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: cognitoConfig.appClientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const authResult = data.AuthenticationResult as Record<string, unknown>;
  if (!authResult) {
    throw new CognitoError('ChallengePending', String(data.ChallengeName ?? 'MFA or other challenge required'));
  }

  const tokens = parseAuthResult(authResult);
  const user = extractUser(tokens.idToken);
  await storeTokens(tokens);
  return { user, tokens };
}

/**
 * Sign up a new user. After this, they receive a verification code by email.
 * Call `cognitoConfirmSignUp` to verify.
 */
export async function cognitoSignUp(
  email: string,
  password: string,
  name: string
): Promise<{ userSub: string; codeDeliveryDetails: unknown }> {
  const data = await callCognito('AmazonCognitoIdentityProviderService.SignUp', {
    ClientId: cognitoConfig.appClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: name },
    ],
  });
  return {
    userSub: String(data.UserSub ?? ''),
    codeDeliveryDetails: data.CodeDeliveryDetails,
  };
}

/**
 * Confirm sign-up with the verification code sent to the user's email.
 */
export async function cognitoConfirmSignUp(email: string, code: string): Promise<void> {
  await callCognito('AmazonCognitoIdentityProviderService.ConfirmSignUp', {
    ClientId: cognitoConfig.appClientId,
    Username: email,
    ConfirmationCode: code,
  });
}

/**
 * Sign the current user out globally (invalidates all tokens).
 */
export async function cognitoSignOut(): Promise<void> {
  const tokens = await loadTokens();
  if (tokens?.accessToken) {
    await callCognito('AmazonCognitoIdentityProviderService.GlobalSignOut', {
      AccessToken: tokens.accessToken,
    }).catch(() => {
      // Best-effort — clear locally regardless
    });
  }
  await clearTokens();
}

/**
 * Send a forgot-password email. The user will receive a reset code.
 */
export async function cognitoForgotPassword(email: string): Promise<void> {
  await callCognito('AmazonCognitoIdentityProviderService.ForgotPassword', {
    ClientId: cognitoConfig.appClientId,
    Username: email,
  });
}

/**
 * Complete password reset with the code from the forgot-password email.
 */
export async function cognitoConfirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  await callCognito('AmazonCognitoIdentityProviderService.ConfirmForgotPassword', {
    ClientId: cognitoConfig.appClientId,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });
}

/**
 * Refresh the current session using the stored refresh token.
 * Returns the updated session, or null if refresh failed.
 */
export async function cognitoRefreshSession(): Promise<CognitoSession | null> {
  const tokens = await loadTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const data = await callCognito('AmazonCognitoIdentityProviderService.InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: cognitoConfig.appClientId,
      AuthParameters: {
        REFRESH_TOKEN: tokens.refreshToken,
      },
    });

    const authResult = data.AuthenticationResult as Record<string, unknown>;
    const newTokens: CognitoTokens = {
      idToken: String(authResult.IdToken),
      accessToken: String(authResult.AccessToken),
      // REFRESH_TOKEN_AUTH response does not include a new refresh token — reuse existing
      refreshToken: tokens.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + Number(authResult.ExpiresIn ?? 3600),
    };
    await storeTokens(newTokens);
    return { user: extractUser(newTokens.idToken), tokens: newTokens };
  } catch {
    await clearTokens();
    return null;
  }
}

/**
 * Get the current Cognito session from storage.
 * Automatically refreshes tokens if they expire within 60 seconds.
 * Returns null if not signed in or if refresh fails.
 */
export async function getCognitoSession(): Promise<CognitoSession | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;

  const nowSecs = Math.floor(Date.now() / 1000);
  if (tokens.expiresAt - nowSecs < 60) {
    return cognitoRefreshSession();
  }

  return { user: extractUser(tokens.idToken), tokens };
}

/**
 * Returns the Cognito ID token for use as a Bearer token in API requests.
 * Refreshes automatically if needed. Returns null if not signed in.
 */
export async function getCognitoIdToken(): Promise<string | null> {
  const session = await getCognitoSession();
  return session?.tokens.idToken ?? null;
}

// ---------------------------------------------------------------------------
// Social login via Cognito Hosted UI (PKCE)
// ---------------------------------------------------------------------------

export const COGNITO_OAUTH_REDIRECT = 'medvba://auth/cognito-callback';

export type CognitoSocialProvider = 'Google' | 'Facebook' | 'SignInWithApple';

/**
 * Generate a cryptographically-random PKCE code verifier (43–128 chars).
 * Uses `crypto.getRandomValues` which is available in RN 0.72+.
 */
function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const len = 128;
  const array = new Uint8Array(len);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join('');
}

/**
 * Compute the PKCE code challenge (S256) for the given verifier.
 * Uses the Web Crypto API available in RN 0.72+.
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  // Base64URL encode
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomState(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Initiate a social login via Cognito Hosted UI.
 *
 * Opens the Cognito Hosted UI in an in-app browser, waits for the
 * `medvba://auth/cognito-callback` deep link, then exchanges the
 * authorization code for tokens.
 *
 * @returns The Cognito session, or null if the user cancelled.
 */
export async function cognitoSocialSignIn(
  provider: CognitoSocialProvider
): Promise<CognitoSession | null> {
  const { domain, appClientId } = cognitoConfig;

  if (!domain || !appClientId) {
    throw new CognitoError(
      'NotConfigured',
      'EXPO_PUBLIC_COGNITO_DOMAIN and EXPO_PUBLIC_COGNITO_APP_CLIENT_ID must be set for social login.'
    );
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = randomState();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: appClientId,
    redirect_uri: COGNITO_OAUTH_REDIRECT,
    scope: 'openid email profile',
    identity_provider: provider,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  });

  const authUrl = `https://${domain}/oauth2/authorize?${params}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, COGNITO_OAUTH_REDIRECT);
  if (result.type !== 'success' || !result.url) {
    return null; // User cancelled
  }

  const parsedUrl = new URL(result.url);
  const code = parsedUrl.searchParams.get('code');
  const returnedState = parsedUrl.searchParams.get('state');

  if (!code) {
    const error = parsedUrl.searchParams.get('error_description') ?? parsedUrl.searchParams.get('error');
    throw new CognitoError('OAuthError', error ?? 'No authorization code returned');
  }
  if (returnedState !== state) {
    throw new CognitoError('StateMismatch', 'OAuth state mismatch — possible CSRF');
  }

  return cognitoExchangeCode(code, verifier);
}

/**
 * Exchange an authorization code (from Cognito Hosted UI) for tokens.
 */
export async function cognitoExchangeCode(
  code: string,
  codeVerifier: string
): Promise<CognitoSession> {
  const { domain, appClientId } = cognitoConfig;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: appClientId,
    redirect_uri: COGNITO_OAUTH_REDIRECT,
    code,
    code_verifier: codeVerifier,
  });

  const res = await fetch(`https://${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string; error_description?: string };
    throw new CognitoError(
      err.error ?? 'TokenExchangeError',
      err.error_description ?? 'Failed to exchange code for tokens'
    );
  }

  const data = await res.json() as {
    id_token: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const tokens: CognitoTokens = {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
  };

  await storeTokens(tokens);
  return { user: extractUser(tokens.idToken), tokens };
}
