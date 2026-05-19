import { logoutAction } from "@/features/auth/actions";
import type { CurrentTenantProfile } from "@/lib/tenant.server";
import { Button, ButtonLink } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export function AppTopbar({ profile }: { profile?: CurrentTenantProfile | null }) {
  return (
    <header className="border-b border-border bg-surface px-5 py-4 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Workspace operacional</p>
          <h1 className="text-xl font-semibold text-foreground">
            {profile?.organization.name ?? "Central IA"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted sm:inline-flex">
            Plano beta
          </span>
          {profile ? (
            <form action={logoutAction}>
              <Button size="sm" type="submit" variant="outline">
                Sair
              </Button>
            </form>
          ) : (
            <ButtonLink href={routes.login} size="sm" variant="outline">
              Entrar
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}
