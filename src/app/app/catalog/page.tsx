import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { CatalogSummary } from "@/features/catalog/components/catalog-summary";
import { CatalogWarning } from "@/features/catalog/components/catalog-warning";
import { ProductList } from "@/features/catalog/components/product-list";
import { ServiceList } from "@/features/catalog/components/service-list";
import { getCatalogPageData } from "@/features/catalog/queries";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogo",
};

export default async function CatalogPage() {
  const data = await getCatalogPageData();

  return (
    <CatalogShell
      description="Gerencie produtos e servicos que a equipe e a IA poderao usar em atendimento, vendas e agendamentos."
      title="Catalogo comercial"
    >
      <CatalogWarning message={data.loadError} />
      <CatalogSummary data={data} />
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={routes.catalogProducts}>Gerenciar produtos</ButtonLink>
        <ButtonLink href={routes.catalogServices} variant="outline">
          Gerenciar servicos
        </ButtonLink>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ProductList canManage={data.canManage} products={data.products.slice(0, 5)} />
        <ServiceList canManage={data.canManage} services={data.services.slice(0, 5)} />
      </div>
    </CatalogShell>
  );
}
