import type { ReactNode } from "react";
import { AiTabs } from "@/features/ai/components/ai-tabs";

export function PlaygroundShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface px-5 py-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          IA
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p>
        <div className="mt-5">
          <AiTabs active="playground" />
        </div>
      </section>
      {children}
    </div>
  );
}
