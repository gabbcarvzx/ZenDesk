import { proofMetrics } from "@/features/marketing/data";

export function ProofSection() {
  return (
    <section className="border-b border-border bg-surface px-6 py-10 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-3">
        {proofMetrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-3xl font-semibold text-foreground">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
