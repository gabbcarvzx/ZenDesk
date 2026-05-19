import { describe, expect, it } from "vitest";
import {
  applyRateLimit,
  buildRateLimitKey,
  getRateLimitHeaders,
} from "./rate-limit";

describe("rate limit", () => {
  it("blocks requests after the configured limit until the window resets", () => {
    const key = `rate-limit-test:${Date.now()}:block`;
    const first = applyRateLimit({
      key,
      limit: 2,
      now: 1_000,
      windowMs: 1_000,
    });
    const second = applyRateLimit({
      key,
      limit: 2,
      now: 1_100,
      windowMs: 1_000,
    });
    const third = applyRateLimit({
      key,
      limit: 2,
      now: 1_200,
      windowMs: 1_000,
    });
    const afterReset = applyRateLimit({
      key,
      limit: 2,
      now: 2_100,
      windowMs: 1_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 1,
    });
    expect(afterReset.allowed).toBe(true);
  });

  it("builds hashed keys without exposing the raw client IP", () => {
    const request = new Request("https://example.test/api", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      },
    });
    const key = buildRateLimitKey("scope", request);

    expect(key).toMatch(/^scope:[a-f0-9]{32}$/);
    expect(key).not.toContain("203.0.113.10");
  });

  it("returns standard rate limit headers", () => {
    const result = applyRateLimit({
      key: `rate-limit-test:${Date.now()}:headers`,
      limit: 1,
      now: 1_000,
      windowMs: 1_000,
    });

    expect(getRateLimitHeaders(result)).toEqual({
      "Retry-After": "0",
      "X-RateLimit-Limit": "1",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "2",
    });
  });
});
