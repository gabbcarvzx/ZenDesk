"use server";

import { revalidatePath } from "next/cache";
import {
  BillingPolicyError,
  assertCanUseFeature,
  getBillingPolicyMessage,
} from "@/lib/billing/policy";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/lib/tenant.server";
import {
  mapCustomerStatusToRow,
  parseCustomerForm,
  parseCustomerUpdateForm,
  type CustomerActionState,
} from "@/features/customers/schema";

const customerPaths = ["/app/customers"];

export async function createCustomerAction(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = parseCustomerForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados do cliente.",
      status: "error",
    };
  }

  return saveCustomerMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin", "agent"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    await assertCanUseFeature({
      feature: "crm",
      organizationId: profile.organizationId,
      planSlug: profile.organization.planSlug,
      supabase,
    });

    const { error } = await supabase.from("customers").insert({
      email: values.email || null,
      last_interaction_at: values.lastContactAt,
      lifecycle_status: mapCustomerStatusToRow(values.status),
      name: values.name,
      notes: values.notes || null,
      organization_id: profile.organizationId,
      phone: values.phone || null,
      source: values.source,
      tags: values.tags,
    });

    if (error) {
      throw error;
    }

    return "Cliente criado com sucesso.";
  });
}

export async function updateCustomerAction(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = parseCustomerUpdateForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados do cliente.",
      status: "error",
    };
  }

  return saveCustomerMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin", "agent"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    await assertCanUseFeature({
      feature: "crm",
      organizationId: profile.organizationId,
      planSlug: profile.organization.planSlug,
      supabase,
    });

    const { error } = await supabase
      .from("customers")
      .update({
        email: values.email || null,
        last_interaction_at: values.lastContactAt,
        lifecycle_status: mapCustomerStatusToRow(values.status),
        name: values.name,
        notes: values.notes || null,
        phone: values.phone || null,
        source: values.source,
        tags: values.tags,
      })
      .eq("id", values.id)
      .eq("organization_id", profile.organizationId);

    if (error) {
      throw error;
    }

    return "Cliente atualizado com sucesso.";
  });
}

async function saveCustomerMutation(
  mutation: () => Promise<string>,
): Promise<CustomerActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase nao esta configurado neste ambiente.",
      status: "error",
    };
  }

  try {
    const message = await mutation();
    revalidateCustomerPaths();

    return {
      message,
      status: "success",
    };
  } catch (error) {
    if (error instanceof BillingPolicyError) {
      return {
        message: getBillingPolicyMessage(error),
        status: "error",
      };
    }

    return {
      message:
        "Nao foi possivel salvar o cliente. Verifique permissao, telefone duplicado ou dados obrigatorios.",
      status: "error",
    };
  }
}

function revalidateCustomerPaths() {
  for (const path of customerPaths) {
    revalidatePath(path);
  }
}
