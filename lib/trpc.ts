import { createTRPCProxyClient, httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";
import { getMedvbaAccessToken } from "@/lib/medvba-access-token";
import { getApiBaseUrl } from "@/lib/api-base-url";

export const trpc = createTRPCReact<AppRouter>();

let vanillaTrpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null = null;

/** Imperative tRPC client (outside React), e.g. report submit from callbacks. */
export function getTrpcVanillaClient() {
  if (!vanillaTrpcClient) {
    vanillaTrpcClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          async headers() {
            const token = getMedvbaAccessToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    });
  }
  return vanillaTrpcClient;
}

const getBaseUrl = () => {
  const url = getApiBaseUrl();

  if (!__DEV__ && url.startsWith("http://")) {
    throw new Error(
      "In production, EXPO_PUBLIC_API_BASE_URL must use HTTPS.",
    );
  }

  return url;
};

/** Create after app shell mounts so `expo-constants` extra (from app.config + .env) is available. */
export function createMedvbaTrpcClient() {
  return trpc.createClient({
    links: [
      httpLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        async headers() {
          const token = getMedvbaAccessToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
