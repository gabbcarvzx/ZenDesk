import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/lib/tenant.server";
import {
  emptyBusinessSettings,
  type BusinessSettingsFormValues,
} from "@/features/settings/business/schema";

type BusinessSettingsRow = {
  address: string | null;
  business_description: string | null;
  business_hours: string | null;
  business_name: string | null;
  cancellation_policy: string | null;
  default_language: string | null;
  google_maps_url: string | null;
  human_handoff_message: string | null;
  important_rules: string | null;
  industry: string | null;
  instagram_url: string | null;
  tone_of_voice: BusinessSettingsFormValues["toneOfVoice"] | null;
  welcome_message: string | null;
};

export type BusinessSettingsPageData = {
  canSubmit: boolean;
  initialSettings: BusinessSettingsFormValues;
  loadError?: string;
};

export async function getBusinessSettingsPageData(): Promise<BusinessSettingsPageData> {
  if (!isSupabaseConfigured()) {
    return {
      canSubmit: false,
      initialSettings: emptyBusinessSettings,
      loadError:
        "Supabase ainda nao esta configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para salvar.",
    };
  }

  try {
    const profile = await requireOrganizationRole(["owner"]);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("business_settings")
      .select(
        [
          "business_name",
          "industry",
          "business_description",
          "address",
          "business_hours",
          "tone_of_voice",
          "default_language",
          "important_rules",
          "welcome_message",
          "human_handoff_message",
          "cancellation_policy",
          "instagram_url",
          "google_maps_url",
        ].join(","),
      )
      .eq("organization_id", profile.organizationId)
      .maybeSingle();

    if (error) {
      return {
        canSubmit: false,
        initialSettings: {
          ...emptyBusinessSettings,
          businessName: profile.organization.name,
        },
        loadError: "Nao foi possivel carregar as configuracoes do negocio.",
      };
    }

    if (!data) {
      return {
        canSubmit: true,
        initialSettings: {
          ...emptyBusinessSettings,
          businessName: profile.organization.name,
        },
      };
    }

    return {
      canSubmit: true,
      initialSettings: mapBusinessSettingsRow(data as unknown as BusinessSettingsRow),
    };
  } catch {
    return {
      canSubmit: false,
      initialSettings: emptyBusinessSettings,
      loadError:
        "Apenas o dono autenticado da organizacao pode editar estas configuracoes.",
    };
  }
}

function mapBusinessSettingsRow(row: BusinessSettingsRow): BusinessSettingsFormValues {
  return {
    address: row.address ?? "",
    businessDescription: row.business_description ?? "",
    businessHours: row.business_hours ?? "",
    businessName: row.business_name ?? "",
    cancellationPolicy: row.cancellation_policy ?? "",
    googleMapsUrl: row.google_maps_url ?? "",
    humanHandoffMessage: row.human_handoff_message ?? "",
    importantRules: row.important_rules ?? "",
    instagramUrl: row.instagram_url ?? "",
    niche: row.industry ?? "",
    primaryLanguage: row.default_language ?? "pt-BR",
    toneOfVoice: row.tone_of_voice ?? "profissional",
    welcomeMessage: row.welcome_message ?? "",
  };
}
