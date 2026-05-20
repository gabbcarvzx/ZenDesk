"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { routes } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/lib/tenant.server";
import { getOnboardingStep, onboardingSteps } from "@/features/training/data";
import {
  emptyOnboardingProgress,
  getOnboardingProgressByOrganization,
} from "@/features/training/queries";
import type {
  OnboardingPayload,
  OnboardingProgress,
  OnboardingStepId,
} from "@/features/training/types";

export type OnboardingFieldErrors = Partial<
  Record<keyof OnboardingPayload, string[]>
>;

export type OnboardingActionState = {
  fieldErrors?: OnboardingFieldErrors;
  message?: string;
  progress?: OnboardingProgress;
  status: "idle" | "success" | "error";
};

const onboardingStepSchema = z.enum([
  "welcome",
  "business",
  "niche",
  "hours",
  "catalog",
  "ai",
  "whatsapp",
  "pix",
  "ai-test",
  "finish",
]);

class OnboardingPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OnboardingPersistenceError";
  }
}

const onboardingSchemas = {
  "ai": z.object({
    humanHandoffMessage: z
      .string()
      .trim()
      .min(5, "Informe a mensagem para transferencia humana.")
      .max(1000, "Use no maximo 1000 caracteres."),
    importantRules: z
      .string()
      .trim()
      .max(2000, "Use no maximo 2000 caracteres.")
      .optional()
      .or(z.literal("")),
    toneOfVoice: z.enum(["profissional", "amigavel", "vendedor", "informal"], {
      error: "Selecione um tom de voz valido.",
    }),
    welcomeMessage: z
      .string()
      .trim()
      .min(5, "Informe uma mensagem de boas-vindas.")
      .max(1000, "Use no maximo 1000 caracteres."),
  }),
  "ai-test": z.object({
    aiTestExpectedAnswer: z
      .string()
      .trim()
      .min(10, "Descreva a resposta esperada com pelo menos 10 caracteres.")
      .max(1500, "Use no maximo 1500 caracteres."),
    aiTestScenario: z
      .string()
      .trim()
      .min(10, "Informe uma pergunta real de cliente.")
      .max(1500, "Use no maximo 1500 caracteres."),
  }),
  business: z.object({
    businessDescription: z
      .string()
      .trim()
      .min(20, "Descreva o negocio com pelo menos 20 caracteres.")
      .max(2000, "Use no maximo 2000 caracteres."),
    businessName: z
      .string()
      .trim()
      .min(2, "Informe o nome da empresa.")
      .max(120, "Use no maximo 120 caracteres."),
  }),
  catalog: z.object({
    catalogSummary: z
      .string()
      .trim()
      .min(10, "Liste pelo menos um produto ou servico.")
      .max(2000, "Use no maximo 2000 caracteres."),
  }),
  finish: z.object({}),
  hours: z.object({
    businessHours: z
      .string()
      .trim()
      .min(2, "Informe o horario de funcionamento.")
      .max(500, "Use no maximo 500 caracteres."),
  }),
  niche: z.object({
    niche: z
      .string()
      .trim()
      .min(2, "Informe o nicho do negocio.")
      .max(120, "Use no maximo 120 caracteres."),
  }),
  pix: z.object({
    pixInstructions: z
      .string()
      .trim()
      .min(10, "Explique quando o Pix deve ser enviado.")
      .max(1000, "Use no maximo 1000 caracteres."),
    pixKey: z
      .string()
      .trim()
      .min(3, "Informe a chave Pix ou referencia interna.")
      .max(160, "Use no maximo 160 caracteres."),
    pixProvider: z.enum(["mercado_pago", "manual"], {
      error: "Selecione como o Pix sera usado.",
    }),
  }),
  welcome: z.object({}),
  whatsapp: z.object({
    whatsappPhoneNumberId: z
      .string()
      .trim()
      .min(5, "Informe o phone number ID do WhatsApp.")
      .max(80, "Use no maximo 80 caracteres.")
      .regex(/^[0-9]+$/, "O phone number ID deve conter apenas numeros."),
  }),
} satisfies Record<OnboardingStepId, z.ZodType<Partial<OnboardingPayload>>>;

export async function saveOnboardingStepAction(
  previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase nao esta configurado neste ambiente.",
      progress: previousState.progress ?? emptyOnboardingProgress,
      status: "error",
    };
  }

  const parsedStep = onboardingStepSchema.safeParse(getFormString(formData, "stepId"));

  if (!parsedStep.success) {
    return {
      message: "Etapa de onboarding invalida.",
      progress: previousState.progress ?? emptyOnboardingProgress,
      status: "error",
    };
  }

  const stepId = parsedStep.data;
  const parsedPayload = parseStepPayload(stepId, formData);

  if (!parsedPayload.success) {
    return {
      fieldErrors: parsedPayload.error.flatten().fieldErrors as OnboardingFieldErrors,
      message: "Revise os campos destacados antes de continuar.",
      progress: previousState.progress ?? emptyOnboardingProgress,
      status: "error",
    };
  }

  try {
    const profile = await requireOrganizationRole(["owner", "admin"]);
    const supabase = await createSupabaseServerClient();
    const currentProgress = await getOnboardingProgressByOrganization({
      organizationId: profile.organizationId,
      supabase,
    });
    const completedSteps = addCompletedStep(currentProgress.completedSteps, stepId);
    const nextStep = getNextIncompleteStepId(completedSteps);
    const completedAt = stepId === "finish" ? new Date().toISOString() : currentProgress.completedAt;
    const payload = normalizePayloadForStorage({
      ...currentProgress.payload,
      ...parsedPayload.data,
    });

    await syncBusinessSettingsFromOnboarding({
      organizationId: profile.organizationId,
      organizationName: profile.organization.name,
      payload,
      stepId,
      supabase,
    });

    const { data, error } = await supabase
      .from("onboarding_progress")
      .upsert(
        {
          completed_at: completedAt,
          completed_steps: completedSteps,
          current_step: nextStep,
          organization_id: profile.organizationId,
          payload,
        },
        { onConflict: "organization_id" },
      )
      .select("current_step,completed_steps,payload,demo_mode_enabled,completed_at")
      .single();

    if (error || !data) {
      return {
        message: "Nao foi possivel salvar o progresso do onboarding.",
        progress: currentProgress,
        status: "error",
      };
    }

    const progress = await getOnboardingProgressByOrganization({
      organizationId: profile.organizationId,
      supabase,
    });

    revalidatePath(routes.onboarding);
    revalidatePath(routes.training);
    revalidatePath(routes.settings);

    return {
      message:
        stepId === "finish"
          ? "Onboarding concluido. Revise o checklist antes do go-live."
          : `${getOnboardingStep(stepId).title} salvo com sucesso.`,
      progress,
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof OnboardingPersistenceError
          ? error.message
          : "Apenas owner ou admin autenticado pode salvar o onboarding da organizacao.",
      progress: previousState.progress ?? emptyOnboardingProgress,
      status: "error",
    };
  }
}

export async function toggleDemoModeAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const profile = await requireOrganizationRole(["owner", "admin"]);
    const supabase = await createSupabaseServerClient();
    const enabled = getFormString(formData, "enabled") === "true";
    const progress = await getOnboardingProgressByOrganization({
      organizationId: profile.organizationId,
      supabase,
    });

    await supabase.from("onboarding_progress").upsert(
      {
        completed_at: progress.completedAt,
        completed_steps: progress.completedSteps,
        current_step: progress.currentStep,
        demo_mode_enabled: enabled,
        organization_id: profile.organizationId,
        payload: normalizePayloadForStorage(progress.payload),
      },
      { onConflict: "organization_id" },
    );

    revalidatePath(routes.training);
  } catch {
    return;
  }
}

function parseStepPayload(stepId: OnboardingStepId, formData: FormData) {
  const step = getOnboardingStep(stepId);
  const values = Object.fromEntries(
    step.fields.map((field) => [field.name, getFormString(formData, field.name)]),
  );

  return onboardingSchemas[stepId].safeParse(values);
}

function addCompletedStep(
  completedSteps: readonly OnboardingStepId[],
  stepId: OnboardingStepId,
): OnboardingStepId[] {
  return Array.from(new Set([...completedSteps, stepId]));
}

function getNextIncompleteStepId(
  completedSteps: readonly OnboardingStepId[],
): OnboardingStepId {
  return (
    onboardingSteps.find((step) => !completedSteps.includes(step.id))?.id ?? "finish"
  );
}

function normalizePayloadForStorage(payload: Partial<OnboardingPayload>): OnboardingPayload {
  return {
    aiTestExpectedAnswer: normalizeOptionalString(payload.aiTestExpectedAnswer),
    aiTestScenario: normalizeOptionalString(payload.aiTestScenario),
    businessDescription: normalizeOptionalString(payload.businessDescription),
    businessHours: normalizeOptionalString(payload.businessHours),
    businessName: normalizeOptionalString(payload.businessName),
    catalogSummary: normalizeOptionalString(payload.catalogSummary),
    humanHandoffMessage: normalizeOptionalString(payload.humanHandoffMessage),
    importantRules: normalizeOptionalString(payload.importantRules),
    niche: normalizeOptionalString(payload.niche),
    pixInstructions: normalizeOptionalString(payload.pixInstructions),
    pixKey: normalizeOptionalString(payload.pixKey),
    pixProvider: payload.pixProvider,
    toneOfVoice: payload.toneOfVoice,
    welcomeMessage: normalizeOptionalString(payload.welcomeMessage),
    whatsappPhoneNumberId: normalizeOptionalString(payload.whatsappPhoneNumberId),
  };
}

async function syncBusinessSettingsFromOnboarding({
  organizationId,
  organizationName,
  payload,
  stepId,
  supabase,
}: {
  organizationId: string;
  organizationName: string;
  payload: OnboardingPayload;
  stepId: OnboardingStepId;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}) {
  if (!["business", "niche", "hours", "ai", "whatsapp"].includes(stepId)) {
    return;
  }

  const row = {
    business_description: payload.businessDescription || undefined,
    business_hours: payload.businessHours || undefined,
    business_name: payload.businessName || organizationName,
    default_language: "pt-BR",
    human_handoff_message: payload.humanHandoffMessage || undefined,
    important_rules: payload.importantRules || undefined,
    industry: payload.niche || undefined,
    organization_id: organizationId,
    tone_of_voice: payload.toneOfVoice || undefined,
    welcome_message: payload.welcomeMessage || undefined,
    whatsapp_phone_number_id: payload.whatsappPhoneNumberId || undefined,
  };

  const { error } = await supabase.from("business_settings").upsert(row, {
    onConflict: "organization_id",
  });

  if (error) {
    throw new OnboardingPersistenceError(
      "Nao foi possivel sincronizar esta etapa com as configuracoes reais da organizacao.",
    );
  }
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
