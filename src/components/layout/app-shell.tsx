import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ProductTourLauncher } from "@/features/training/components/product-tour-launcher";
import type { CurrentTenantProfile } from "@/lib/tenant.server";

export function AppShell({
  children,
  profile,
}: {
  children: ReactNode;
  profile?: CurrentTenantProfile | null;
}) {
  return (
    <div className="min-h-screen bg-[#f4f6f8] text-foreground">
      <div className="flex min-h-screen">
        <AppSidebar profile={profile} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar profile={profile} />
          <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
            {children}
          </main>
          <ProductTourLauncher />
        </div>
      </div>
    </div>
  );
}
