"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteProductAction, updateProductAction } from "@/features/catalog/actions";
import { CatalogStatusMessage } from "@/features/catalog/components/catalog-status-message";
import { ProductFields } from "@/features/catalog/components/product-create-form";
import { formatPriceInput, initialCatalogActionState } from "@/features/catalog/schema";
import type { CatalogProduct } from "@/features/catalog/types";

export function ProductEditForm({
  canManage,
  product,
}: {
  canManage: boolean;
  product: CatalogProduct;
}) {
  const [state, action, isPending] = useActionState(
    updateProductAction,
    initialCatalogActionState,
  );
  const disabled = !canManage || isPending;

  return (
    <details className="rounded-lg border border-border bg-[#f8faf9] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Editar produto
      </summary>
      <div className="mt-4 space-y-4">
        {state.message ? (
          <CatalogStatusMessage
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
        ) : null}
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={product.id} />
          <ProductFields
            defaultValues={{
              category: product.category,
              description: product.description,
              name: product.name,
              price: formatPriceInput(product.priceCents),
              status: product.status,
              stockQuantity: product.stockQuantity,
            }}
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix={`product-${product.id}`}
          />
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button disabled={disabled} type="submit">
              {isPending ? "Salvando..." : "Salvar produto"}
            </Button>
          </div>
        </form>
        <form action={deleteProductAction}>
          <input name="id" type="hidden" value={product.id} />
          <Button disabled={!canManage} size="sm" type="submit" variant="danger">
            Deletar produto
          </Button>
        </form>
      </div>
    </details>
  );
}
