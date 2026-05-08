import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import Constants from "expo-constants";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";
import { getCognitoIdToken } from "@/lib/cognito";

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

/** Resolve the Cognito ID token to attach to every tRPC request. */
async function getAuthToken(): Promise<string | null> {
  return getCognitoIdToken();
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
