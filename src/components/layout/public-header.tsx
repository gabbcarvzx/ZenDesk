import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { publicNavigation } from "@/lib/navigation";
import { routes } from "@/lib/routes";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
        <BrandLogo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
          {publicNavigation.map((item) => (
            <Link className="transition hover:text-foreground" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href={routes.login} size="sm" variant="ghost">
            Entrar
          </ButtonLink>
          <ButtonLink href={routes.register} size="sm">
            Teste grátis
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
