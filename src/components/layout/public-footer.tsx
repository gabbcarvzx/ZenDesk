import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { appConfig } from "@/lib/app-config";
import { publicNavigation } from "@/lib/navigation";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
            {appConfig.description}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-muted">
          {publicNavigation.map((item) => (
            <Link className="transition hover:text-foreground" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
