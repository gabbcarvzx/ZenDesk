import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export function AppTopbar() {
  return (
    <header className="border-b border-border bg-surface px-5 py-4 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Workspace operacional</p>
          <h1 className="text-xl font-semibold text-foreground">Dashboard principal</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted sm:inline-flex">
            Plano Pro
          </span>
          <ButtonLink href={routes.login} size="sm" variant="outline">
            Sair
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
