import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { registerAuthSessionRoutes } from "./auth/session-routes";
import { registerRevenueCatWebhookRoutes } from "./webhooks/revenuecat-webhook";
import { probeSupabaseServiceRole } from "./lib/health-supabase";

const app = new Hono();

const defaultAllowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:19000",
  "http://localhost:19001",
  "http://localhost:19002",
  "http://localhost:19006",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
  // Allow React Native apps (origin can be null or file://)
  "null",
  "file://",
]);
const envAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...defaultAllowedOrigins,
  ...envAllowedOrigins,
]);

app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests with no origin (React Native apps, mobile)
      if (!origin) return "*";
      // Allow configured origins
      if (allowedOrigins.has(origin)) return origin;
      // Allow file:// origins (React Native)
      if (origin.startsWith("file://")) return origin;
      // Expo web / dev UI may send *.expo.dev Origin
      if (/^https:\/\/([a-z0-9-]+\.)*expo\.dev$/i.test(origin)) return origin;
      return "";
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

registerAuthSessionRoutes(app);
registerRevenueCatWebhookRoutes(app);

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "Anatomy Quiz API is running" });
});

// Health check endpoint for debugging
app.get("/health", (c) => {
  const ai = process.env.AI_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  const expoAiLeak = !!process.env.EXPO_PUBLIC_AI_API_KEY?.trim();
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    /** Live Supabase service-role probe (subscriptions SELECT limit 1). */
    liveSupabaseProbe: "/api/health",
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAiApiKey: !!(ai || openai),
      /** Which server AI key vars are set (no values). */
      aiKeyHints: {
        AI_API_KEY: !!ai,
        OPENAI_API_KEY: !!openai,
      },
      /** True if EXPO_PUBLIC_AI_API_KEY is still in .env — remove it; use AI_API_KEY / OPENAI_API_KEY for backend only. */
      legacyExpoPublicAiKeyPresent: expoAiLeak,
      aiProvider: process.env.AI_PROVIDER || process.env.EXPO_PUBLIC_AI_PROVIDER || '(not set, defaults to openai)',
      hasAiBaseUrl: !!(process.env.AI_BASE_URL || process.env.EXPO_PUBLIC_AI_BASE_URL),
      aiModel: process.env.AI_MODEL || process.env.EXPO_PUBLIC_AI_MODEL || '(not set, defaults to gpt-4o-mini)',
      hasCorsOrigins: !!process.env.CORS_ALLOWED_ORIGINS,
      revenueCatWebhook: !!process.env.REVENUECAT_WEBHOOK_AUTHORIZATION?.trim(),
      revenueCatRestSecret: !!(process.env.REVENUECAT_SECRET_API_KEY?.trim() || process.env.REVENUECAT_API_SECRET_KEY?.trim()),
    }
  });
});

/** Live probe: Supabase service role can read `subscriptions` (same path as premium checks). */
app.get("/api/health", async (c) => {
  const verbose =
    process.env.NODE_ENV !== "production" || process.env.HEALTHCHECK_VERBOSE === "true";

  const supabaseEnvConfigured =
    !!process.env.SUPABASE_URL?.trim() && !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const probe = await probeSupabaseServiceRole();

  const ai = process.env.AI_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();

  const body: Record<string, unknown> = {
    status: probe.ok ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      supabaseEnvConfigured,
      supabaseServiceRoleSubscriptionsSelect: probe.ok ? "ok" : "error",
    },
    hints: {
      aiApiKeyConfigured: !!(ai || openai),
    },
  };

  if (verbose && !probe.ok) {
    body.supabaseError = probe.error;
  }

  return c.json(body, probe.ok ? 200 : 503);
});

// Error handler
app.onError((err, c) => {
  return c.json({ error: err.message }, 500);
});

export default app;
