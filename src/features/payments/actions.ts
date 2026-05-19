"use server";

import { revalidatePath } from "next/cache";
import { ManualPaymentProvider } from "@/lib/billing/payment-provider";
import {
  BillingPolicyError,
  assertCanUseFeature,
  getBillingPolicyMessage,
} from "@/lib/billing/policy";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/lib/tenant.server";
import {
  mapPaymentStatusToRow,
  parsePaymentForm,
  type PaymentActionState,
} from "@/features/payments/schema";

const paymentsPath = "/app/payments";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ConversationRow = {
  customer_id: string | null;
  id: string;
};

export async function createManualPaymentAction(
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = parsePaymentForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados da cobranca.",
      status: "error",
    };
  }

  return savePaymentMutation(async () => {
    const profile = await requireOrganizationRole(["owner", "admin", "agent"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;
    const provider = new ManualPaymentProvider();

    await assertCanUseFeature({
      feature: "pixPayments",
      organizationId: profile.organizationId,
      planSlug: profile.organization.planSlug,
      supabase,
    });

    await assertCustomerBelongsToTenant(
      supabase,
      profile.organizationId,
      values.customerId,
    );

    if (values.conversationId) {
      await assertConversationBelongsToTenant({
        conversationId: values.conversationId,
        customerId: values.customerId,
        organizationId: profile.organizationId,
        supabase,
      });
    }

    const providerResult = await provider.createCharge({
      amountCents: values.amountCents,
      conversationId: values.conversationId,
      currency: "BRL",
      customerId: values.customerId,
      description: values.description,
      dueAt: values.dueAt,
      method: values.method,
      organizationId: profile.organizationId,
    });
    const now = new Date().toISOString();

    const { error } = await supabase.from("payments").insert({
      amount_cents: values.amountCents,
      conversation_id: values.conversationId,
      currency: "BRL",
      customer_id: values.customerId,
      description: values.description,
      due_at: values.dueAt,
      metadata: {
        createdByProfileId: profile.id,
        method: values.method,
        providerResult: {
          expiresAt: providerResult.expiresAt ?? null,
          status: providerResult.status,
        },
        source: "manual_charge",
      },
      organization_id: profile.organizationId,
      paid_at: values.status === "paid" ? now : null,
      provider: providerResult.provider,
      provider_payment_id: providerResult.providerPaymentId ?? null,
      status: mapPaymentStatusToRow(values.status),
    });

    if (error) {
      throw error;
    }

    return "Cobranca criada com sucesso.";
  });
}

async function savePaymentMutation(
  mutation: () => Promise<string>,
): Promise<PaymentActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase nao esta configurado neste ambiente.",
      status: "error",
    };
  }

  try {
    const message = await mutation();
    revalidatePath(paymentsPath);

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
        "Nao foi possivel salvar a cobranca. Verifique cliente, conversa, valor e permissao.",
      status: "error",
    };
  }
}

async function assertCustomerBelongsToTenant(
  supabase: SupabaseServerClient,
  organizationId: string,
  customerId: string,
) {
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", customerId)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Customer not found");
  }
}

async function assertConversationBelongsToTenant({
  conversationId,
  customerId,
  organizationId,
  supabase,
}: {
  conversationId: string;
  customerId: string;
  organizationId: string;
  supabase: SupabaseServerClient;
}) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id,customer_id")
    .eq("organization_id", organizationId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Conversation not found");
  }

  const conversation = data as ConversationRow;

  if (conversation.customer_id && conversation.customer_id !== customerId) {
    throw new Error("Conversation belongs to another customer");
  }
}
