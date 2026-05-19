import type { BillingPlanSlug } from "./billing/policy";

export type TenantRole = "owner" | "admin" | "agent";

export type ProfileStatus = "active" | "invited" | "removed";

export type OrganizationStatus = "active" | "suspended" | "deleted";

export type ActiveOrganization = {
  id: string;
  name: string;
  planSlug: BillingPlanSlug;
  slug: string;
  role: TenantRole;
  status: OrganizationStatus;
};

export function assertSameOrganization(
  expectedOrganizationId: string,
  receivedOrganizationId: string,
) {
  if (expectedOrganizationId !== receivedOrganizationId) {
    throw new Error("Cross-tenant access denied");
  }
}

export function canManageOrganization(role: TenantRole) {
  return role === "owner" || role === "admin";
}

export function canManageBilling(role: TenantRole) {
  return role === "owner";
}
