import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

export function HelpTip({
  children,
  className,
  label = "Ajuda",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <button
        aria-label={label}
        className="inline-flex size-6 items-center justify-center rounded-md text-muted transition hover:bg-surface-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="button"
      >
        <CircleHelp aria-hidden="true" className="size-4" />
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-72 -translate-x-1/2 rounded-md border border-border bg-surface px-3 py-2 text-left text-xs leading-5 text-muted shadow-lg group-hover:block group-focus-within:block">
        {children}
      </span>
    </span>
  );
}
