import {
  createError,
  defineEventHandler,
  getRequestIP,
  getRequestURL,
  type H3Event,
  setHeader
} from "h3";

type RateLimitRule = {
  name: string;
  max: number;
  windowMs: number;
  matches: (path: string) => boolean;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getPositiveIntegerEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);

  return Number.isInteger(value) && value > 0 ? value : fallback;
}

const rules: RateLimitRule[] = [
  {
    name: "auth",
    max: getPositiveIntegerEnv("RATE_LIMIT_AUTH_MAX", 30),
    windowMs: getPositiveIntegerEnv("RATE_LIMIT_AUTH_WINDOW_MS", 60_000),
    matches: (path) => path.startsWith("/api/auth")
  },
  {
    name: "upload",
    max: getPositiveIntegerEnv("RATE_LIMIT_UPLOAD_MAX", 20),
    windowMs: getPositiveIntegerEnv("RATE_LIMIT_UPLOAD_WINDOW_MS", 60_000),
    matches: (path) => path.startsWith("/api/admin/upload")
  },
  {
    name: "cart_order",
    max: getPositiveIntegerEnv("RATE_LIMIT_CART_ORDER_MAX", 120),
    windowMs: getPositiveIntegerEnv("RATE_LIMIT_CART_ORDER_WINDOW_MS", 60_000),
    matches: (path) =>
      path.startsWith("/api/public/cart") ||
      path.startsWith("/api/public/orders") ||
      path.startsWith("/api/admin/orders")
  }
];

function getClientKey(event: H3Event) {
  return getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
}

function cleanupExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export default defineEventHandler((event) => {
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return;
  }

  const path = getRequestURL(event).pathname;
  const rule = rules.find((candidate) => candidate.matches(path));

  if (!rule) {
    return;
  }

  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = `${rule.name}:${getClientKey(event)}`;
  const current = buckets.get(key);
  const bucket =
    current && current.resetAt > now
      ? current
      : {
        count: 0,
        resetAt: now + rule.windowMs
      };

  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(rule.max - bucket.count, 0);
  const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

  setHeader(event, "X-RateLimit-Limit", String(rule.max));
  setHeader(event, "X-RateLimit-Remaining", String(remaining));
  setHeader(event, "X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > rule.max) {
    setHeader(event, "Retry-After", resetSeconds);

    throw createError({
      statusCode: 429,
      message: "Слишком много запросов, попробуйте позже"
    });
  }
});
