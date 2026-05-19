import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { resolveProtectedAppAccess } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentTenantProfile } from "@/lib/tenant.server";

export const metadata: Metadata = {
  title: "Aplicativo",
};

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  let profile = null;
  const supabaseConfigured = isSupabaseConfigured();

  if (supabaseConfigured) {
    profile = await getCurrentTenantProfile();
  }

  const access = resolveProtectedAppAccess({
    hasTenantProfile: Boolean(profile),
    supabaseConfigured,
  });

  if (access.status === "redirect") {
    redirect(access.destination);
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
