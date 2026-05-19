"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/lib/tenant.server";
import {
  parseBusinessSettingsForm,
  type BusinessSettingsActionState,
} from "@/features/settings/business/schema";

export async function saveBusinessSettingsAction(
  _previousState: BusinessSettingsActionState,
  formData: FormData,
): Promise<BusinessSettingsActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase nao esta configurado neste ambiente.",
      status: "error",
    };
  }

  const parsed = parseBusinessSettingsForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os campos destacados antes de salvar.",
      status: "error",
    };
  }

  try {
    const profile = await requireOrganizationRole(["owner"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    const { error } = await supabase
      .from("business_settings")
      .upsert(
        {
          address: values.address || null,
          business_description: values.businessDescription,
          business_hours: values.businessHours,
          business_name: values.businessName,
          cancellation_policy: values.cancellationPolicy || null,
          default_language: values.primaryLanguage,
          google_maps_url: values.googleMapsUrl || null,
          human_handoff_message: values.humanHandoffMessage,
          important_rules: values.importantRules || null,
          industry: values.niche,
          instagram_url: values.instagramUrl || null,
          organization_id: profile.organizationId,
          tone_of_voice: values.toneOfVoice,
          welcome_message: values.welcomeMessage,
        },
        { onConflict: "organization_id" },
      )
      .select("id")
      .single();

    if (error) {
      return {
        message: "Nao foi possivel salvar as configuracoes no Supabase.",
        status: "error",
      };
    }

    revalidatePath("/app/settings/business");

    return {
      message: "Configuracoes do negocio salvas com sucesso.",
      status: "success",
    };
  } catch {
    return {
      message: "Apenas o dono autenticado da organizacao pode salvar estas configuracoes.",
      status: "error",
    };
  }
}
