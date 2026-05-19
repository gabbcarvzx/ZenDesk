import { createHash } from "crypto";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const RATE_LIMIT_STORE_KEY = "__zendesk_rate_limit_store__" as const;
const MAX_BUCKETS = 10_000;

const globalForRateLimit = globalThis as typeof globalThis & {
  [RATE_LIMIT_STORE_KEY]?: Map<string, RateLimitBucket>;
};

const rateLimitStore =
  globalForRateLimit[RATE_LIMIT_STORE_KEY] ?? new Map<string, RateLimitBucket>();

globalForRateLimit[RATE_LIMIT_STORE_KEY] = rateLimitStore;

export function applyRateLimit({
  key,
  limit,
  now = Date.now(),
  windowMs,
}: {
  key: string;
  limit: number;
  now?: number;
  windowMs: number;
}): RateLimitResult {
  if (rateLimitStore.size > MAX_BUCKETS) {
    pruneExpiredBuckets(now);
    trimOldestBuckets();
  }

  const normalizedKey = key.trim() || "anonymous";
  const existingBucket = rateLimitStore.get(normalizedKey);

  if (!existingBucket || existingBucket.resetAt <= now) {
    const resetAt = now + windowMs;

    rateLimitStore.set(normalizedKey, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (existingBucket.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: existingBucket.resetAt,
      retryAfterSeconds: getRetryAfterSeconds(existingBucket.resetAt, now),
    };
  }

  existingBucket.count += 1;

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - existingBucket.count),
    resetAt: existingBucket.resetAt,
    retryAfterSeconds: 0,
  };
}

export function buildRateLimitKey(scope: string, request: Request) {
  const clientIdentifier = getClientIdentifier(request);

  return `${scope}:${hashIdentifier(clientIdentifier)}`;
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.trim() ?? "unknown-user-agent";

  return forwardedFor || realIp || cloudflareIp || `unknown:${userAgent}`;
}

function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function getRetryAfterSeconds(resetAt: number, now: number) {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function trimOldestBuckets() {
  while (rateLimitStore.size > MAX_BUCKETS) {
    const oldestKey = rateLimitStore.keys().next().value;

    if (!oldestKey) {
      return;
    }

    rateLimitStore.delete(oldestKey);
  }
}
