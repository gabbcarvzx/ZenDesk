import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { routes } from "@/lib/routes";
import { getCurrentTenantProfile } from "@/lib/tenant.server";

export const metadata: Metadata = {
  title: "Aplicativo",
};

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  let profile = null;

  if (isSupabaseConfigured()) {
    profile = await getCurrentTenantProfile();

    if (!profile) {
      redirect(routes.login);
    }
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
