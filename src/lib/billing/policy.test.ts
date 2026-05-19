import { describe, expect, it } from "vitest";
import {
  assertFeatureAccess,
  billingPlans,
  checkFeatureAccess,
  getBillingPlan,
  normalizeBillingPlanSlug,
} from "./policy";

describe("billing policy", () => {
  it("normalizes unknown plans to starter", () => {
    expect(normalizeBillingPlanSlug("enterprise")).toBe("starter");
    expect(getBillingPlan(null)).toBe(billingPlans.starter);
  });

  it("blocks paid features on Starter", () => {
    expect(
      checkFeatureAccess({
        feature: "pixPayments",
        planSlug: "starter",
      }).allowed,
    ).toBe(false);
    expect(
      checkFeatureAccess({
        feature: "appointments",
        planSlug: "starter",
      }).allowed,
    ).toBe(false);
  });

  it("allows commercial features on Pro and Business", () => {
    expect(
      checkFeatureAccess({
        feature: "pixPayments",
        planSlug: "pro",
      }).allowed,
    ).toBe(true);
    expect(
      checkFeatureAccess({
        feature: "advancedAnalytics",
        planSlug: "business",
      }).allowed,
    ).toBe(true);
  });

  it("throws a typed error when a feature is not in the plan", () => {
    expect(() =>
      assertFeatureAccess({
        feature: "humanHandoff",
        planSlug: "starter",
      }),
    ).toThrow("handoff humano nao esta incluido");
  });
});
