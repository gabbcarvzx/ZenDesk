import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import type { IntelligentEmptyStateProps } from "@/features/training/types";

export function EmptyEducation({
  action,
  benefit,
  icon,
  title,
  tutorial,
}: IntelligentEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-muted p-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="inline-flex size-11 items-center justify-center rounded-lg bg-surface text-primary shadow-sm">
          {icon}
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{benefit}</p>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm leading-6 text-muted">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{tutorial}</span>
        </div>
        {action ? (
          <ButtonLink className="mt-5" href={action.href} size="sm">
            {action.label}
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
