import type { Metadata } from "next";
import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { CatalogWarning } from "@/features/catalog/components/catalog-warning";
import { ServiceCreateForm } from "@/features/catalog/components/service-create-form";
import { ServiceList } from "@/features/catalog/components/service-list";
import { getCatalogPageData } from "@/features/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Servicos",
};

export default async function ServicesPage() {
  const data = await getCatalogPageData();

  return (
    <CatalogShell
      description="Cadastre, edite e remova servicos da organizacao para atendimento, vendas e agenda."
      title="Servicos"
    >
      <CatalogWarning message={data.loadError} />
      <ServiceCreateForm canManage={data.canManage} />
      <ServiceList canManage={data.canManage} services={data.services} />
    </CatalogShell>
  );
}
