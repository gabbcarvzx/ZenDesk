import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  CalendarDays,
  CreditCard,
  GraduationCap,
  LifeBuoy,
  LayoutDashboard,
  MessageSquareText,
  PackageOpen,
  Settings,
  UsersRound,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { dashboardNavigation } from "@/lib/navigation";
import type { CurrentTenantProfile } from "@/lib/tenant.server";

const navIcons: Record<(typeof dashboardNavigation)[number]["href"], LucideIcon> = {
  "/app/ai/playground": Bot,
  "/app/appointments": CalendarDays,
  "/app/catalog": PackageOpen,
  "/app/conversations": MessageSquareText,
  "/app/customers": UsersRound,
  "/app/dashboard": LayoutDashboard,
  "/app/help-center": LifeBuoy,
  "/app/training": GraduationCap,
  "/app/payments": CreditCard,
  "/app/settings/business": Settings,
};

const navTourIds: Partial<Record<(typeof dashboardNavigation)[number]["href"], string>> = {
  "/app/ai/playground": "nav-ai",
  "/app/conversations": "nav-conversations",
  "/app/customers": "nav-customers",
  "/app/dashboard": "nav-dashboard",
  "/app/payments": "nav-payments",
  "/app/settings/business": "nav-settings",
  "/app/training": "nav-training",
};

export function AppSidebar({ profile }: { profile?: CurrentTenantProfile | null }) {
  const organizationName = profile?.organization.name ?? "Ambiente local";
  const roleLabel = profile ? getRoleLabel(profile.role) : "Sem sessão";

  return (
    <aside className="hidden w-72 shrink-0 border-r border-border bg-surface px-5 py-6 lg:flex lg:flex-col">
      <BrandLogo />
      <div className="mt-8 rounded-lg border border-border bg-surface-muted p-4">
        <p className="text-xs font-semibold uppercase text-primary">
          Organização ativa
        </p>
        <p className="mt-2 text-sm font-semibold text-foreground">{organizationName}</p>
        <div className="mt-3">
          <Badge>{roleLabel}</Badge>
        </div>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {dashboardNavigation.map((item) => {
          const Icon = navIcons[item.href];

          return (
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
              data-tour-id={navTourIds[item.href]}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm font-semibold text-foreground">Isolamento por tenant</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Todas as áreas operacionais filtram dados por organização no servidor.
        </p>
      </div>
    </aside>
  );
}

function getRoleLabel(role: CurrentTenantProfile["role"]) {
  const labels: Record<CurrentTenantProfile["role"], string> = {
    admin: "Admin",
    agent: "Atendente",
    owner: "Dono",
  };

  return labels[role];
}
