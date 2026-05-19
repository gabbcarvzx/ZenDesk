import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { operatingPillars } from "@/features/marketing/data";

export function OperationsSection() {
  return (
    <section className="bg-surface px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Base operacional
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
            Os modulos iniciais ja nascem separados por dominio de SaaS.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted">
            A aplicacao foi organizada para evoluir sem misturar frontend,
            regras server-side, billing, IA e integracoes externas.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {operatingPillars.map((pillar) => (
            <Card key={pillar.title}>
              <CardHeader>
                <CardTitle>{pillar.title}</CardTitle>
                <CardDescription>{pillar.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-primary">{pillar.impact}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
