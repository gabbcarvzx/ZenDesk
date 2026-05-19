import { PackageOpen } from "lucide-react";
import { EmptyEducation } from "@/components/ui/empty-education";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductEditForm } from "@/features/catalog/components/product-edit-form";
import { formatCurrency } from "@/features/catalog/schema";
import type { CatalogProduct } from "@/features/catalog/types";
import { routes } from "@/lib/routes";

export function ProductList({
  canManage,
  products,
}: {
  canManage: boolean;
  products: CatalogProduct[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos cadastrados</CardTitle>
        <CardDescription>
          Lista tenant-scoped de produtos que podem ser usados em vendas e respostas da IA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <EmptyEducation
            action={{ href: routes.catalogProducts, label: "Cadastrar produto" }}
            benefit="Produtos com nome, preco e descricao ajudam a IA a vender com clareza e reduzem perguntas repetidas no WhatsApp."
            icon={<PackageOpen aria-hidden="true" className="size-5" />}
            title="Nenhum produto cadastrado"
            tutorial="Comece pelos itens mais vendidos. Inclua preco, categoria e uma descricao curta que um cliente leigo entenderia."
          />
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <article className="rounded-lg border border-border p-4" key={product.id}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      <Badge
                        className={
                          product.status === "active"
                            ? "bg-[#ecfdf3] text-[#067647]"
                            : "bg-[#f3f5f7] text-muted"
                        }
                      >
                        {product.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                      {product.category ? <Badge>{product.category}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {product.description || "Sem descricao cadastrada."}
                    </p>
                  </div>
                  <div className="shrink-0 text-left lg:text-right">
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(product.priceCents)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Estoque: {product.stockQuantity ?? "nao controlado"}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <ProductEditForm canManage={canManage} product={product} />
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
