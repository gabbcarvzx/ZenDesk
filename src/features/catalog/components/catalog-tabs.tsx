import Link from "next/link";
import { routes } from "@/lib/routes";

const catalogTabs = [
  { href: routes.catalog, label: "Visao geral" },
  { href: routes.catalogProducts, label: "Produtos" },
  { href: routes.catalogServices, label: "Servicos" },
] as const;

export function CatalogTabs() {
  return (
    <nav className="flex flex-wrap gap-2">
      {catalogTabs.map((tab) => (
        <Link
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground"
          href={tab.href}
          key={tab.href}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
