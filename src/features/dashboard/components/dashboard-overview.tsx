import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardChart } from "@/features/dashboard/components/dashboard-chart";
import { DashboardMetricCard } from "@/features/dashboard/components/dashboard-metric-card";
import { RecentConversationsTable } from "@/features/dashboard/components/recent-conversations-table";
import type { DashboardOverviewData } from "@/features/dashboard/types";

type DashboardOverviewProps = {
  dashboard: DashboardOverviewData;
};

export function DashboardOverview({ dashboard }: DashboardOverviewProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface px-5 py-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">
              {dashboard.organizationName}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Visão geral da operação
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Indicadores operacionais para acompanhar atendimento, vendas, agenda,
              cobrança e necessidade de intervenção humana por organização.
            </p>
          </div>
          <div className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm font-semibold text-foreground">
            Periodo: {dashboard.periodLabel}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboard.metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Mensagens por dia</CardTitle>
            <CardDescription>
              Volume semanal para acompanhar demanda, custo de IA e necessidade de equipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardChart data={dashboard.messageVolume} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimas conversas</CardTitle>
            <CardDescription>
              Conversas recentes com status, intencao comercial e sinal de handoff humano.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentConversationsTable conversations={dashboard.recentConversations} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
