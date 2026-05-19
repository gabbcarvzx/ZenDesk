"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { createProductAction } from "@/features/catalog/actions";
import { CatalogFieldError } from "@/features/catalog/components/catalog-field-error";
import { CatalogStatusMessage } from "@/features/catalog/components/catalog-status-message";
import {
  catalogStatusOptions,
  initialCatalogActionState,
} from "@/features/catalog/schema";

export function ProductCreateForm({ canManage }: { canManage: boolean }) {
  const [state, action, isPending] = useActionState(
    createProductAction,
    initialCatalogActionState,
  );
  const disabled = !canManage || isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar produto</CardTitle>
        <CardDescription>
          Produtos ficam isolados por organization_id e podem ser usados no atendimento
          comercial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {state.message ? (
            <div className="md:col-span-2">
              <CatalogStatusMessage
                message={state.message}
                tone={state.status === "success" ? "success" : "error"}
              />
            </div>
          ) : null}
          <ProductFields
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix="create-product"
          />
          <div className="md:col-span-2">
            <Button disabled={disabled} type="submit">
              {isPending ? "Salvando..." : "Criar produto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ProductFields({
  defaultValues,
  disabled,
  errors,
  idPrefix = "product",
}: {
  defaultValues?: {
    category?: string | null;
    description?: string | null;
    name?: string;
    price?: string;
    status?: string;
    stockQuantity?: number | null;
  };
  disabled: boolean;
  errors?: Record<string, string[] | undefined>;
  idPrefix?: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Nome</Label>
        <Input
          defaultValue={defaultValues?.name ?? ""}
          disabled={disabled}
          id={`${idPrefix}-name`}
          name="name"
          placeholder="Produto ou pacote"
          required
        />
        <CatalogFieldError error={errors?.name?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-price`}>Preco</Label>
        <Input
          defaultValue={defaultValues?.price ?? ""}
          disabled={disabled}
          id={`${idPrefix}-price`}
          inputMode="decimal"
          name="price"
          placeholder="129,90"
          required
        />
        <CatalogFieldError error={errors?.priceCents?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-category`}>Categoria</Label>
        <Input
          defaultValue={defaultValues?.category ?? ""}
          disabled={disabled}
          id={`${idPrefix}-category`}
          name="category"
          placeholder="Linha, marca ou grupo"
        />
        <CatalogFieldError error={errors?.category?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-stock`}>Estoque opcional</Label>
        <Input
          defaultValue={defaultValues?.stockQuantity ?? ""}
          disabled={disabled}
          id={`${idPrefix}-stock`}
          inputMode="numeric"
          name="stockQuantity"
          placeholder="10"
        />
        <CatalogFieldError error={errors?.stockQuantity?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-status`}>Status</Label>
        <Select
          defaultValue={defaultValues?.status ?? "active"}
          disabled={disabled}
          id={`${idPrefix}-status`}
          name="status"
        >
          {catalogStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <CatalogFieldError error={errors?.status?.[0]} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Descricao</Label>
        <Textarea
          defaultValue={defaultValues?.description ?? ""}
          disabled={disabled}
          id={`${idPrefix}-description`}
          name="description"
          placeholder="Explique detalhes que a IA pode usar para vender melhor."
        />
        <CatalogFieldError error={errors?.description?.[0]} />
      </div>
    </>
  );
}
