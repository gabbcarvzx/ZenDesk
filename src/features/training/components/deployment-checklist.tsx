import { AlertTriangle, CheckCircle2, CircleX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ChecklistStatus,
  DeploymentChecklist as DeploymentChecklistData,
} from "@/features/training/types";
import { cn } from "@/lib/utils";

export function DeploymentChecklist({
  checklist,
}: {
  checklist: DeploymentChecklistData;
}) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <CardTitle>Checklist de implantacao</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted">
              Status calculado com dados reais da organizacao autenticada.
            </p>
          </div>
          <div className="min-w-44">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
              <span>{checklist.percentage}% pronto</span>
              <span>
                {checklist.completedCount}/{checklist.totalCount}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${checklist.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-3">
          {checklist.items.map((item) => (
            <article
              className="rounded-lg border border-border bg-surface px-4 py-4"
              key={item.id}
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div className="flex min-w-0 gap-3">
                  <StatusIcon status={item.status} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{item.label}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-primary">
                      Impacto: {item.businessImpact}
                    </p>
                  </div>
                </div>
                {item.actionHref && item.actionLabel ? (
                  <ButtonLink
                    className="shrink-0"
                    href={item.actionHref}
                    size="sm"
                    variant={item.status === "done" ? "outline" : "primary"}
                  >
                    {item.actionLabel}
                  </ButtonLink>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: ChecklistStatus }) {
  const Icon =
    status === "done" ? CheckCircle2 : status === "warning" ? AlertTriangle : CircleX;

  return (
    <span
      className={cn(
        "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
        status === "done"
          ? "bg-[#ecfdf3] text-[#067647]"
          : status === "warning"
            ? "bg-[#fff7ed] text-[#b54708]"
            : "bg-[#fff1f0] text-danger",
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
    </span>
  );
}

function StatusBadge({ status }: { status: ChecklistStatus }) {
  const label =
    status === "done" ? "Configurado" : status === "warning" ? "Atenção" : "Pendente";

  return (
    <Badge
      className={
        status === "done"
          ? "bg-[#ecfdf3] text-[#067647]"
          : status === "warning"
            ? "bg-[#fff7ed] text-[#b54708]"
            : "bg-[#fff1f0] text-danger"
      }
    >
      {label}
    </Badge>
  );
}
