import { routes } from "../routes";

export type ProtectedAppAccessDecision =
  | {
      destination: string;
      status: "redirect";
    }
  | {
      status: "allow";
    };

export function resolveProtectedAppAccess({
  hasTenantProfile,
  supabaseConfigured,
}: {
  hasTenantProfile: boolean;
  supabaseConfigured: boolean;
}): ProtectedAppAccessDecision {
  if (supabaseConfigured && !hasTenantProfile) {
    return {
      destination: routes.login,
      status: "redirect",
    };
  }

  return {
    status: "allow",
  };
}
