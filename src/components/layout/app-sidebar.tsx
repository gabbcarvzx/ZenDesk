import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  MessageSquareText,
  PackageOpen,
  Settings,
  UsersRound,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { dashboardNavigation } from "@/lib/navigation";

const navIcons: Record<(typeof dashboardNavigation)[number]["href"], LucideIcon> = {
  "/app/ai/playground": Bot,
  "/app/appointments": CalendarDays,
  "/app/catalog": PackageOpen,
  "/app/conversations": MessageSquareText,
  "/app/customers": UsersRound,
  "/app/dashboard": LayoutDashboard,
  "/app/payments": CreditCard,
  "/app/settings/business": Settings,
};

export function AppSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border bg-surface px-5 py-6 lg:flex lg:flex-col">
      <BrandLogo />
      <div className="mt-8 rounded-lg border border-border bg-surface-muted p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Organizacao ativa
        </p>
        <p className="mt-2 text-sm font-semibold text-foreground">Clinica Exemplo</p>
        <div className="mt-3">
          <Badge>Trial seguro</Badge>
        </div>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {dashboardNavigation.map((item) => {
          const Icon = navIcons[item.href];

          return (
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
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
          Todos os modulos futuros devem filtrar dados por organization_id.
        </p>
      </div>
    </aside>
  );
}
