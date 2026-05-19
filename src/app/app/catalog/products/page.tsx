import type { Metadata } from "next";
import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { CatalogWarning } from "@/features/catalog/components/catalog-warning";
import { ProductCreateForm } from "@/features/catalog/components/product-create-form";
import { ProductList } from "@/features/catalog/components/product-list";
import { getCatalogPageData } from "@/features/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produtos",
};

export default async function ProductsPage() {
  const data = await getCatalogPageData();

  return (
    <CatalogShell
      description="Cadastre, edite e remova produtos da organizacao. Todas as operacoes usam organization_id no servidor."
      title="Produtos"
    >
      <CatalogWarning message={data.loadError} />
      <ProductCreateForm canManage={data.canManage} />
      <ProductList canManage={data.canManage} products={data.products} />
    </CatalogShell>
  );
}
