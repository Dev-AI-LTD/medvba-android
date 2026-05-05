import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import Constants from "expo-constants";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";
import { supabase } from "@/lib/supabase";
import { isCognitoConfigured, getCognitoIdToken } from "@/lib/cognito";

export const trpc = createTRPCReact<AppRouter>();

const extraConfig =
  Constants.expoConfig?.extra ?? (Constants as any)?.manifest?.extra ?? {};

const getBaseUrl = () => {
  const raw =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL ||
    extraConfig.EXPO_PUBLIC_API_BASE_URL ||
    extraConfig.EXPO_PUBLIC_RORK_API_BASE_URL ||
    extraConfig.apiBaseUrl;

  if (!raw) {
    throw new Error(
      "Set EXPO_PUBLIC_API_BASE_URL (or EXPO_PUBLIC_RORK_API_BASE_URL) in .env and restart.",
    );
  }

  const url = String(raw).trim().replace(/\/+$/, "");

  if (!__DEV__ && url.startsWith("http://")) {
    throw new Error(
      "In production, EXPO_PUBLIC_API_BASE_URL must use HTTPS.",
    );
  }

  return url;
};

/**
 * Resolve the Bearer token to attach to every tRPC request.
 *
 * Priority:
 *   1. Cognito ID token (when EXPO_PUBLIC_COGNITO_USER_POOL_ID is set)
 *   2. Supabase access token (legacy / transition period)
 */
async function getAuthToken(): Promise<string | null> {
  if (isCognitoConfigured()) {
    const cognitoToken = await getCognitoIdToken();
    if (cognitoToken) return cognitoToken;
  }

  // Fallback to Supabase session (during migration or when Cognito is not configured)
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        const token = await getAuthToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
