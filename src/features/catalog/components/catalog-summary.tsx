import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CatalogPageData } from "@/features/catalog/types";

export function CatalogSummary({ data }: { data: CatalogPageData }) {
  const activeProducts = data.products.filter((product) => product.status === "active").length;
  const activeServices = data.services.filter((service) => service.status === "active").length;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total de produtos</CardDescription>
          <CardTitle className="text-3xl">{data.products.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">{activeProducts} ativos no catalogo.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total de servicos</CardDescription>
          <CardTitle className="text-3xl">{data.services.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">{activeServices} ativos para atendimento e agenda.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Permissao</CardDescription>
          <CardTitle className="text-3xl">{data.canManage ? "Admin" : "Leitura"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Criacao, edicao e exclusao exigem owner ou admin.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
