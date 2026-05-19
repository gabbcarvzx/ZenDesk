import type { DashboardMetric } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type DashboardMetricCardProps = {
  metric: DashboardMetric;
};

const toneClasses: Record<DashboardMetric["tone"], string> = {
  danger: "border-[#ffd8d3] bg-[#fff1f0] text-danger",
  neutral: "border-border bg-[#f3f5f7] text-[#344054]",
  primary: "border-[#c8ded8] bg-[#e5f2ee] text-primary",
  success: "border-[#abefc6] bg-[#ecfdf3] text-[#067647]",
  warning: "border-[#fedf89] bg-[#fff7ed] text-[#b54708]",
};

export function DashboardMetricCard({ metric }: DashboardMetricCardProps) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-muted">{metric.label}</p>
        <span
          className={cn(
            "rounded-md border px-2 py-1 text-xs font-semibold",
            toneClasses[metric.tone],
          )}
        >
          {metric.trend}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
        {metric.value}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted">{metric.description}</p>
    </article>
  );
}
