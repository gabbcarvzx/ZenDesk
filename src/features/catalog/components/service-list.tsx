import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceEditForm } from "@/features/catalog/components/service-edit-form";
import { formatCurrency } from "@/features/catalog/schema";
import type { CatalogService } from "@/features/catalog/types";

export function ServiceList({
  canManage,
  services,
}: {
  canManage: boolean;
  services: CatalogService[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicos cadastrados</CardTitle>
        <CardDescription>
          Servicos tenant-scoped para venda consultiva, agenda e automacoes futuras.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <EmptyState message="Nenhum servico cadastrado ainda." />
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <article className="rounded-lg border border-border p-4" key={service.id}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      <Badge
                        className={
                          service.status === "active"
                            ? "bg-[#ecfdf3] text-[#067647]"
                            : "bg-[#f3f5f7] text-muted"
                        }
                      >
                        {service.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                      {service.category ? <Badge>{service.category}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {service.description || "Sem descricao cadastrada."}
                    </p>
                  </div>
                  <div className="shrink-0 text-left lg:text-right">
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(service.priceCents)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Duracao: {service.durationMinutes} min
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <ServiceEditForm canManage={canManage} service={service} />
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-muted">
      {message}
    </div>
  );
}
