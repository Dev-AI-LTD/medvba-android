import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { registerAuthSessionRoutes } from "./auth/session-routes";
import { registerRevenueCatWebhookRoutes } from "./webhooks/revenuecat-webhook";
import { registerClinicalStreamRoutes } from "./clinical-stream";
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
registerClinicalStreamRoutes(app);

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

function clinicalCopilotEnabledFlag(): boolean {
  return (
    String(
      process.env.CLINICAL_COPILOT_ENABLED ??
        process.env.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED ??
        "false",
    )
      .trim()
      .toLowerCase() === "true" ||
    String(process.env.CLINICAL_COPILOT_ENABLED ?? "").trim() === "1"
  );
}

function resolveBuildVersion(): string | null {
  return (
    process.env.RAILWAY_GIT_COMMIT_SHA?.trim()?.slice(0, 12) ||
    process.env.npm_package_version?.trim() ||
    null
  );
}

/**
 * Public health — minimal. No provider keys, URLs, model names, or SDK details.
 */
app.get("/health", (c) => {
  const body: Record<string, unknown> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    clinicalCopilotEnabled: clinicalCopilotEnabledFlag(),
  };
  const version = resolveBuildVersion();
  if (version) body.version = version;
  return c.json(body);
});

/**
 * Internal readiness — requires INTERNAL_HEALTH_SECRET Bearer token.
 * Exposes operational booleans only (no secrets, URLs, or model names).
 */
app.get("/health/ready", (c) => {
  const secret = process.env.INTERNAL_HEALTH_SECRET?.trim();
  if (!secret) {
    return c.json({ status: "error", error: "not_configured" }, 503);
  }
  const auth = c.req.header("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token || token !== secret) {
    return c.json({ status: "error", error: "unauthorized" }, 401);
  }

  const aiProvider =
    process.env.AI_PROVIDER?.trim().toLowerCase() === "muse" ? "muse" : "openai";
  const hasMetaModelApiKey = !!process.env.META_MODEL_API_KEY?.trim();
  const hasTutorAiKey = !!(
    process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()
  );

  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    clinicalCopilotEnabled: clinicalCopilotEnabledFlag(),
    aiProvider,
    hasMetaModelApiKey,
    hasTutorAiKey,
    version: resolveBuildVersion(),
  });
});

/** Live probe: Supabase service role can read `subscriptions` (same path as premium checks). */
app.get("/api/health", async (c) => {
  const verbose =
    process.env.NODE_ENV !== "production" || process.env.HEALTHCHECK_VERBOSE === "true";

  const supabaseEnvConfigured =
    !!process.env.SUPABASE_URL?.trim() && !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const probe = await probeSupabaseServiceRole();

  const body: Record<string, unknown> = {
    status: probe.ok ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    clinicalCopilotEnabled: clinicalCopilotEnabledFlag(),
    checks: {
      supabaseEnvConfigured,
      supabaseServiceRoleSubscriptionsSelect: probe.ok ? "ok" : "error",
    },
  };

  if (verbose && !probe.ok) {
    body.supabaseError = probe.error;
  }

  return c.json(body, probe.ok ? 200 : 503);
});

// Error handler
app.onError((err, c) => {
  const isProd = process.env.NODE_ENV === "production";
  return c.json({ error: isProd ? "Internal Server Error" : err.message }, 500);
});

export default app;
