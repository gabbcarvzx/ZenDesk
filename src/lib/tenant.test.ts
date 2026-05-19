import { describe, expect, it } from "vitest";
import {
  assertSameOrganization,
  canManageBilling,
  canManageOrganization,
} from "./tenant";

describe("tenant guards", () => {
  it("allows operations inside the same organization", () => {
    expect(() => assertSameOrganization("org_a", "org_a")).not.toThrow();
  });

  it("blocks cross-tenant organization access", () => {
    expect(() => assertSameOrganization("org_a", "org_b")).toThrow(
      "Cross-tenant access denied",
    );
  });

  it("keeps organization management restricted to owner and admin", () => {
    expect(canManageOrganization("owner")).toBe(true);
    expect(canManageOrganization("admin")).toBe(true);
    expect(canManageOrganization("agent")).toBe(false);
  });

  it("keeps billing management restricted to owner", () => {
    expect(canManageBilling("owner")).toBe(true);
    expect(canManageBilling("admin")).toBe(false);
    expect(canManageBilling("agent")).toBe(false);
  });
});
