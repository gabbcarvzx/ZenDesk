"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/lib/tenant.server";
import {
  parseDeleteCatalogItemForm,
  parseProductForm,
  parseProductUpdateForm,
  parseServiceForm,
  parseServiceUpdateForm,
  type CatalogActionState,
} from "@/features/catalog/schema";

const catalogPaths = ["/app/catalog", "/app/catalog/products", "/app/catalog/services"];

export async function createProductAction(
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const parsed = parseProductForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados do produto.",
      status: "error",
    };
  }

  return saveCatalogMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    const { error } = await supabase.from("products").insert({
      category: values.category || null,
      description: values.description || null,
      name: values.name,
      organization_id: profile.organizationId,
      price_cents: values.priceCents,
      status: values.status,
      stock_quantity: values.stockQuantity,
    });

    if (error) {
      throw error;
    }

    return "Produto criado com sucesso.";
  });
}

export async function updateProductAction(
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const parsed = parseProductUpdateForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados do produto.",
      status: "error",
    };
  }

  return saveCatalogMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    const { error } = await supabase
      .from("products")
      .update({
        category: values.category || null,
        description: values.description || null,
        name: values.name,
        price_cents: values.priceCents,
        status: values.status,
        stock_quantity: values.stockQuantity,
      })
      .eq("id", values.id)
      .eq("organization_id", profile.organizationId);

    if (error) {
      throw error;
    }

    return "Produto atualizado com sucesso.";
  });
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const parsed = parseDeleteCatalogItemForm(formData);

  if (!parsed.success || !isSupabaseConfigured()) {
    return;
  }

  try {
    const profile = await requireOrganizationRole(["owner", "admin"]);
    const supabase = await createSupabaseServerClient();

    await supabase
      .from("products")
      .delete()
      .eq("id", parsed.data.id)
      .eq("organization_id", profile.organizationId);

    revalidateCatalogPaths();
  } catch {
    // The UI remains unchanged when authorization or deletion fails.
  }
}

export async function createServiceAction(
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const parsed = parseServiceForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados do servico.",
      status: "error",
    };
  }

  return saveCatalogMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    const { error } = await supabase.from("services").insert({
      category: values.category || null,
      description: values.description || null,
      duration_minutes: values.durationMinutes,
      name: values.name,
      organization_id: profile.organizationId,
      price_cents: values.priceCents,
      status: values.status,
    });

    if (error) {
      throw error;
    }

    return "Servico criado com sucesso.";
  });
}

export async function updateServiceAction(
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const parsed = parseServiceUpdateForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados do servico.",
      status: "error",
    };
  }

  return saveCatalogMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    const { error } = await supabase
      .from("services")
      .update({
        category: values.category || null,
        description: values.description || null,
        duration_minutes: values.durationMinutes,
        name: values.name,
        price_cents: values.priceCents,
        status: values.status,
      })
      .eq("id", values.id)
      .eq("organization_id", profile.organizationId);

    if (error) {
      throw error;
    }

    return "Servico atualizado com sucesso.";
  });
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  const parsed = parseDeleteCatalogItemForm(formData);

  if (!parsed.success || !isSupabaseConfigured()) {
    return;
  }

  try {
    const profile = await requireOrganizationRole(["owner", "admin"]);
    const supabase = await createSupabaseServerClient();

    await supabase
      .from("services")
      .delete()
      .eq("id", parsed.data.id)
      .eq("organization_id", profile.organizationId);

    revalidateCatalogPaths();
  } catch {
    // The UI remains unchanged when authorization or deletion fails.
  }
}

async function saveCatalogMutation(mutation: () => Promise<string>): Promise<CatalogActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase nao esta configurado neste ambiente.",
      status: "error",
    };
  }

  try {
    const message = await mutation();
    revalidateCatalogPaths();

    return {
      message,
      status: "success",
    };
  } catch {
    return {
      message: "Nao foi possivel salvar. Verifique sua permissao e tente novamente.",
      status: "error",
    };
  }
}

function revalidateCatalogPaths() {
  for (const path of catalogPaths) {
    revalidatePath(path);
  }
}
