import type { User } from "@supabase/supabase-js";
import { normalizeBillingPlanSlug } from "@/lib/billing/policy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActiveOrganization,
  OrganizationStatus,
  ProfileStatus,
  TenantRole,
} from "@/lib/tenant";

type ProfileOrganizationRow = {
  id: string;
  name: string;
  plan_slug: string | null;
  slug: string;
  status: OrganizationStatus;
};

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationRequiredError";
  }
}

export class OrganizationRequiredError extends Error {
  constructor() {
    super("Authenticated user does not belong to an active organization");
    this.name = "OrganizationRequiredError";
  }
}

export class OrganizationAccessDeniedError extends Error {
  constructor() {
    super("User is not allowed to access this organization");
    this.name = "OrganizationAccessDeniedError";
  }
}

type ProfileWithOrganizationRow = {
  id: string;
  user_id: string;
  organization_id: string;
  full_name: string | null;
  role: TenantRole;
  status: ProfileStatus;
  organizations: ProfileOrganizationRow | ProfileOrganizationRow[] | null;
};

export type CurrentTenantProfile = {
  id: string;
  userId: string;
  organizationId: string;
  fullName: string | null;
  role: TenantRole;
  status: ProfileStatus;
  organization: ActiveOrganization;
};

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function requireAuthenticatedUser(): Promise<User> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new AuthenticationRequiredError();
  }

  return user;
}

export async function getCurrentTenantProfile(): Promise<CurrentTenantProfile | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,user_id,organization_id,full_name,role,status,organizations:organization_id(id,name,slug,plan_slug,status)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const profile = data as unknown as ProfileWithOrganizationRow;
  const organization = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  if (!organization || organization.status !== "active") {
    return null;
  }

  return {
    fullName: profile.full_name,
    id: profile.id,
    organization: {
      id: organization.id,
      name: organization.name,
      planSlug: normalizeBillingPlanSlug(organization.plan_slug),
      role: profile.role,
      slug: organization.slug,
      status: organization.status,
    },
    organizationId: profile.organization_id,
    role: profile.role,
    status: profile.status,
    userId: profile.user_id,
  };
}

export async function getCurrentOrganizationId(): Promise<string | null> {
  const profile = await getCurrentTenantProfile();
  return profile?.organizationId ?? null;
}

export async function requireCurrentOrganization(): Promise<ActiveOrganization> {
  const profile = await getCurrentTenantProfile();

  if (!profile) {
    throw new OrganizationRequiredError();
  }

  return profile.organization;
}

export async function requireCurrentOrganizationId(): Promise<string> {
  const organizationId = await getCurrentOrganizationId();

  if (!organizationId) {
    throw new OrganizationRequiredError();
  }

  return organizationId;
}

export async function requireOrganizationRole(
  allowedRoles: readonly TenantRole[],
): Promise<CurrentTenantProfile> {
  const profile = await getCurrentTenantProfile();

  if (!profile) {
    throw new OrganizationRequiredError();
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new OrganizationAccessDeniedError();
  }

  return profile;
}

export async function assertCanAccessOrganization(organizationId: string): Promise<void> {
  const currentOrganizationId = await requireCurrentOrganizationId();

  if (currentOrganizationId !== organizationId) {
    throw new OrganizationAccessDeniedError();
  }
}
