import type { MessageVolumePoint } from "@/features/dashboard/types";

type DashboardChartProps = {
  data: MessageVolumePoint[];
};

export function DashboardChart({ data }: DashboardChartProps) {
  const maxMessages = Math.max(1, ...data.map((point) => point.messages));

  return (
    <div className="h-full">
      <div className="flex h-72 items-end gap-3 rounded-lg border border-border bg-[#f8faf9] px-4 pb-4 pt-6">
        {data.map((point) => {
          const height =
            point.messages > 0
              ? Math.max(16, Math.round((point.messages / maxMessages) * 100))
              : 2;

          return (
            <div className="flex h-full min-w-0 flex-1 flex-col justify-end gap-3" key={point.day}>
              <div className="flex flex-1 items-end">
                <div
                  aria-label={`${point.day}: ${point.messages} mensagens`}
                  className="w-full rounded-t-md bg-primary transition hover:bg-[#0b5c52]"
                  style={{ height: `${height}%` }}
                  title={`${point.day}: ${point.messages} mensagens`}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground">{point.shortLabel}</p>
                <p className="mt-1 font-mono text-xs text-muted">{point.messages}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
