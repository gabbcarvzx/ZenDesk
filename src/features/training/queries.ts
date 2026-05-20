import { checkFeatureAccess } from "@/lib/billing/policy";
import { getMissingEnv, isSupabaseConfigured, featureEnvKeys } from "@/lib/env";
import { routes } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentTenantProfile } from "@/lib/tenant.server";
import { defaultDemoData } from "@/features/training/data";
import type {
  ChecklistStatus,
  DeploymentChecklist,
  DeploymentChecklistItem,
  OnboardingPageData,
  OnboardingPayload,
  OnboardingProgress,
  OnboardingStepId,
  TrainingPageData,
} from "@/features/training/types";
import { onboardingStepIds } from "@/features/training/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type OnboardingProgressRow = {
  completed_at: string | null;
  completed_steps: string[] | null;
  current_step: string | null;
  demo_mode_enabled: boolean | null;
  payload: unknown;
};

type BusinessSettingsRow = {
  ai_enabled: boolean | null;
  business_description: string | null;
  business_hours: string | null;
  business_name: string | null;
  human_handoff_message: string | null;
  industry: string | null;
  tone_of_voice: string | null;
  welcome_message: string | null;
  whatsapp_phone_number_id: string | null;
};

export type ReadinessSnapshot = {
  activeKnowledgeCount: number;
  businessSettings: BusinessSettingsRow | null;
  conversationCount: number;
  onboarding: OnboardingProgress;
  paymentCount: number;
  productCount: number;
  serviceCount: number;
};

export const emptyOnboardingProgress: OnboardingProgress = {
  completedAt: null,
  completedSteps: [],
  currentStep: "welcome",
  demoModeEnabled: false,
  payload: {},
};

export async function getTrainingPageData(): Promise<TrainingPageData> {
  const fallback = getFallbackTrainingPageData();

  if (!isSupabaseConfigured()) {
    return {
      ...fallback,
      loadError:
        "Supabase ainda nao esta configurado. O treinamento aparece em modo local, mas o progresso nao sera persistido.",
    };
  }

  try {
    const profile = await getCurrentTenantProfile();

    if (!profile) {
      return {
        ...fallback,
        loadError:
          "Entre com uma conta vinculada a uma organizacao para ver o treinamento.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const snapshot = await getReadinessSnapshot({
      organizationId: profile.organizationId,
      supabase,
    });

    return {
      checklist: buildDeploymentChecklist({
        planSlug: profile.organization.planSlug,
        snapshot,
      }),
      demo: {
        ...defaultDemoData,
        enabled: snapshot.onboarding.demoModeEnabled,
      },
      onboarding: snapshot.onboarding,
      organizationName: profile.organization.name,
    };
  } catch {
    return {
      ...fallback,
      loadError:
        "Nao foi possivel carregar o treinamento. Verifique permissoes e migrations do Supabase.",
    };
  }
}

export async function getOnboardingPageData(): Promise<OnboardingPageData> {
  const fallback = getFallbackOnboardingPageData();

  if (!isSupabaseConfigured()) {
    return {
      ...fallback,
      loadError:
        "Supabase ainda nao esta configurado. Configure o ambiente para salvar o progresso.",
    };
  }

  try {
    const profile = await getCurrentTenantProfile();

    if (!profile) {
      return {
        ...fallback,
        loadError: "Entre com uma conta vinculada a uma organizacao para continuar.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const snapshot = await getReadinessSnapshot({
      organizationId: profile.organizationId,
      supabase,
    });

    return {
      canManage: profile.role === "owner" || profile.role === "admin",
      checklist: buildDeploymentChecklist({
        planSlug: profile.organization.planSlug,
        snapshot,
      }),
      onboarding: snapshot.onboarding,
      organizationName: profile.organization.name,
    };
  } catch {
    return {
      ...fallback,
      loadError:
        "Nao foi possivel carregar seu onboarding. Confirme se a migration onboarding_progress foi aplicada.",
    };
  }
}

export async function getOnboardingProgressByOrganization({
  organizationId,
  supabase,
}: {
  organizationId: string;
  supabase: SupabaseServerClient;
}): Promise<OnboardingProgress> {
  const { data, error } = await supabase
    .from("onboarding_progress")
    .select("current_step,completed_steps,payload,demo_mode_enabled,completed_at")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return emptyOnboardingProgress;
  }

  return mapOnboardingProgressRow(data as unknown as OnboardingProgressRow);
}

function getFallbackTrainingPageData(): TrainingPageData {
  return {
    checklist: buildEmptyChecklist(),
    demo: {
      ...defaultDemoData,
      enabled: false,
    },
    onboarding: emptyOnboardingProgress,
    organizationName: "Ambiente local",
  };
}

function getFallbackOnboardingPageData(): OnboardingPageData {
  return {
    canManage: false,
    checklist: buildEmptyChecklist(),
    onboarding: emptyOnboardingProgress,
    organizationName: "Ambiente local",
  };
}

async function getReadinessSnapshot({
  organizationId,
  supabase,
}: {
  organizationId: string;
  supabase: SupabaseServerClient;
}): Promise<ReadinessSnapshot> {
  const [
    onboarding,
    businessSettings,
    productCount,
    serviceCount,
    activeKnowledgeCount,
    conversationCount,
    paymentCount,
  ] = await Promise.all([
    getOnboardingProgressByOrganization({ organizationId, supabase }),
    getBusinessSettings({ organizationId, supabase }),
    getTableCount({ organizationId, supabase, table: "products" }),
    getTableCount({ organizationId, supabase, table: "services" }),
    getActiveKnowledgeCount({ organizationId, supabase }),
    getTableCount({ organizationId, supabase, table: "conversations" }),
    getTableCount({ organizationId, supabase, table: "payments" }),
  ]);

  return {
    activeKnowledgeCount,
    businessSettings,
    conversationCount,
    onboarding,
    paymentCount,
    productCount,
    serviceCount,
  };
}

async function getBusinessSettings({
  organizationId,
  supabase,
}: {
  organizationId: string;
  supabase: SupabaseServerClient;
}): Promise<BusinessSettingsRow | null> {
  const { data, error } = await supabase
    .from("business_settings")
    .select(
      [
        "ai_enabled",
        "business_name",
        "business_description",
        "industry",
        "business_hours",
        "tone_of_voice",
        "welcome_message",
        "human_handoff_message",
        "whatsapp_phone_number_id",
      ].join(","),
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as unknown as BusinessSettingsRow | null) ?? null;
}

async function getTableCount({
  organizationId,
  supabase,
  table,
}: {
  organizationId: string;
  supabase: SupabaseServerClient;
  table: "conversations" | "payments" | "products" | "services";
}) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getActiveKnowledgeCount({
  organizationId,
  supabase,
}: {
  organizationId: string;
  supabase: SupabaseServerClient;
}) {
  const { count, error } = await supabase
    .from("ai_knowledge_base")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export function buildDeploymentChecklist({
  planSlug,
  snapshot,
}: {
  planSlug: string;
  snapshot: ReadinessSnapshot;
}): DeploymentChecklist {
  const business = snapshot.businessSettings;
  const hasBusinessCore = Boolean(
    filled(business?.business_name) &&
      filled(business?.business_description) &&
      filled(business?.industry) &&
      filled(business?.business_hours),
  );
  const hasAiCore = Boolean(
    filled(business?.tone_of_voice) &&
      filled(business?.welcome_message) &&
      filled(business?.human_handoff_message),
  );
  const hasCatalog = snapshot.productCount + snapshot.serviceCount > 0;
  const hasWhatsAppId = filled(business?.whatsapp_phone_number_id);
  const whatsappEnvReady = getMissingEnv(featureEnvKeys.whatsapp).length === 0;
  const mercadoPagoReady = getMissingEnv(featureEnvKeys.mercadoPago).length === 0;
  const pixAccess = checkFeatureAccess({ feature: "pixPayments", planSlug });
  const handoffAccess = checkFeatureAccess({ feature: "humanHandoff", planSlug });
  const onboardingPayload = snapshot.onboarding.payload;
  const hasPixSetup = filled(onboardingPayload.pixProvider) && filled(onboardingPayload.pixKey);
  const hasAiTest = snapshot.onboarding.completedSteps.includes("ai-test");

  const items: DeploymentChecklistItem[] = [
    {
      actionHref: routes.settings,
      actionLabel: "Configurar empresa",
      businessImpact: "A IA passa a responder com dados corretos da empresa.",
      description: hasBusinessCore
        ? "Nome, nicho, descricao e horario foram encontrados."
        : "Complete nome, descricao, nicho e horario de funcionamento.",
      id: "business",
      label: "Empresa configurada",
      status: hasBusinessCore ? "done" : "missing",
    },
    {
      actionHref: routes.catalog,
      actionLabel: "Abrir catalogo",
      businessImpact: "Clientes entendem oferta, preco e proximos passos sem suporte.",
      description: hasCatalog
        ? `${snapshot.productCount} produtos e ${snapshot.serviceCount} servicos cadastrados.`
        : "Cadastre pelo menos um produto ou servico real.",
      id: "catalog",
      label: "Produtos e servicos cadastrados",
      status: hasCatalog ? "done" : "missing",
    },
    {
      actionHref: routes.aiPlayground,
      actionLabel: "Testar IA",
      businessImpact: "Reduz risco operacional antes de expor a IA ao WhatsApp.",
      description: hasAiCore
        ? "Tom, boas-vindas e transferencia humana ja estao definidos."
        : "Configure tom de voz, mensagem inicial e mensagem de handoff.",
      id: "ai",
      label: "IA configurada",
      status: hasAiCore ? "done" : "missing",
    },
    {
      actionHref: routes.ai,
      actionLabel: "Base de conhecimento",
      businessImpact: "Respostas ficam menos genericas e mais alinhadas ao negocio.",
      description:
        snapshot.activeKnowledgeCount > 0
          ? `${snapshot.activeKnowledgeCount} itens ativos na base.`
          : "Adicione FAQ, regras e detalhes operacionais.",
      id: "knowledge",
      label: "Base de conhecimento ativa",
      status: snapshot.activeKnowledgeCount > 0 ? "done" : "warning",
    },
    {
      actionHref: routes.onboarding,
      actionLabel: "Conectar WhatsApp",
      businessImpact: "Ativa o principal canal comercial do produto.",
      description: getWhatsAppChecklistDescription({
        hasWhatsAppId,
        whatsappEnvReady,
      }),
      id: "whatsapp",
      label: "WhatsApp conectado",
      status: getIntegrationStatus({ configured: hasWhatsAppId, envReady: whatsappEnvReady }),
    },
    {
      actionHref: routes.onboarding,
      actionLabel: "Configurar Pix",
      businessImpact: "Permite cobrar no momento de maior intencao de compra.",
      description: getPixChecklistDescription({
        hasPixSetup,
        mercadoPagoReady,
        pixAllowed: pixAccess.allowed,
      }),
      id: "pix",
      label: "Pix configurado",
      status: getPixStatus({
        hasPixSetup,
        mercadoPagoReady,
        pixAllowed: pixAccess.allowed,
      }),
    },
    {
      actionHref: routes.onboarding,
      actionLabel: "Registrar teste",
      businessImpact: "Valida qualidade antes de falar com clientes reais.",
      description: hasAiTest
        ? "Um cenario de teste foi registrado no onboarding."
        : "Teste uma pergunta real e registre a resposta esperada.",
      id: "ai-test",
      label: "Atendimento IA testado",
      status: hasAiTest ? "done" : "missing",
    },
    {
      actionHref: routes.conversations,
      actionLabel: "Abrir conversas",
      businessImpact: "Garante que a equipe sabe onde acompanhar clientes.",
      description:
        snapshot.conversationCount > 0
          ? `${snapshot.conversationCount} conversas encontradas.`
          : "Ainda nao ha conversas reais; use o modo demo para treinar a equipe.",
      id: "conversations",
      label: "Conversas prontas para uso",
      status: snapshot.conversationCount > 0 ? "done" : "warning",
    },
    {
      actionHref: routes.conversations,
      actionLabel: "Ver handoff",
      businessImpact: "Evita perda de vendas quando a IA precisa de uma pessoa.",
      description: handoffAccess.allowed
        ? "Plano permite handoff; confirme a mensagem e o processo da equipe."
        : "Plano atual nao inclui handoff humano completo.",
      id: "handoff",
      label: "Atendimento humano preparado",
      status:
        handoffAccess.allowed && filled(business?.human_handoff_message)
          ? "done"
          : "warning",
    },
    {
      actionHref: routes.dashboard,
      actionLabel: "Ver metricas",
      businessImpact: "Ajuda o dono a acompanhar ativacao, receita e gargalos.",
      description:
        snapshot.conversationCount + snapshot.paymentCount > 0
          ? "Dashboard ja possui dados operacionais para acompanhar."
          : "Metricas ficam mais uteis apos primeiras conversas e cobrancas.",
      id: "metrics",
      label: "Metricas interpretaveis",
      status: snapshot.conversationCount + snapshot.paymentCount > 0 ? "done" : "warning",
    },
  ];

  return summarizeChecklist(items);
}

function buildEmptyChecklist(): DeploymentChecklist {
  return summarizeChecklist([
    {
      businessImpact: "Configure o Supabase para calcular o status real do tenant.",
      description: "Status indisponivel em modo local.",
      id: "environment",
      label: "Ambiente conectado",
      status: "warning",
    },
  ]);
}

function summarizeChecklist(items: DeploymentChecklistItem[]): DeploymentChecklist {
  const completedCount = items.filter((item) => item.status === "done").length;

  return {
    completedCount,
    items,
    percentage: Math.round((completedCount / items.length) * 100),
    totalCount: items.length,
  };
}

export function mapOnboardingProgressRow(row: OnboardingProgressRow): OnboardingProgress {
  return {
    completedAt: row.completed_at,
    completedSteps: normalizeCompletedSteps(row.completed_steps),
    currentStep: normalizeStepId(row.current_step),
    demoModeEnabled: Boolean(row.demo_mode_enabled),
    payload: normalizePayload(row.payload),
  };
}

function normalizeCompletedSteps(values: string[] | null): OnboardingStepId[] {
  if (!values) {
    return [];
  }

  return values.filter((value): value is OnboardingStepId => isOnboardingStepId(value));
}

function normalizeStepId(value: string | null | undefined): OnboardingStepId {
  return isOnboardingStepId(value) ? value : "welcome";
}

function isOnboardingStepId(value: unknown): value is OnboardingStepId {
  return typeof value === "string" && onboardingStepIds.includes(value as OnboardingStepId);
}

function normalizePayload(value: unknown): OnboardingPayload {
  if (!isRecord(value)) {
    return {};
  }

  return {
    aiTestExpectedAnswer: getString(value.aiTestExpectedAnswer),
    aiTestScenario: getString(value.aiTestScenario),
    businessDescription: getString(value.businessDescription),
    businessHours: getString(value.businessHours),
    businessName: getString(value.businessName),
    catalogSummary: getString(value.catalogSummary),
    humanHandoffMessage: getString(value.humanHandoffMessage),
    importantRules: getString(value.importantRules),
    niche: getString(value.niche),
    pixInstructions: getString(value.pixInstructions),
    pixKey: getString(value.pixKey),
    pixProvider: normalizePixProvider(value.pixProvider),
    toneOfVoice: normalizeTone(value.toneOfVoice),
    welcomeMessage: getString(value.welcomeMessage),
    whatsappPhoneNumberId: getString(value.whatsappPhoneNumberId),
  };
}

function normalizeTone(value: unknown) {
  return value === "profissional" ||
    value === "amigavel" ||
    value === "vendedor" ||
    value === "informal"
    ? value
    : undefined;
}

function normalizePixProvider(value: unknown) {
  return value === "mercado_pago" || value === "manual" ? value : undefined;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function filled(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function getIntegrationStatus({
  configured,
  envReady,
}: {
  configured: boolean;
  envReady: boolean;
}): ChecklistStatus {
  if (configured && envReady) {
    return "done";
  }

  if (configured || envReady) {
    return "warning";
  }

  return "missing";
}

function getPixStatus({
  hasPixSetup,
  mercadoPagoReady,
  pixAllowed,
}: {
  hasPixSetup: boolean;
  mercadoPagoReady: boolean;
  pixAllowed: boolean;
}): ChecklistStatus {
  if (hasPixSetup && mercadoPagoReady && pixAllowed) {
    return "done";
  }

  if (hasPixSetup || mercadoPagoReady || pixAllowed) {
    return "warning";
  }

  return "missing";
}

function getWhatsAppChecklistDescription({
  hasWhatsAppId,
  whatsappEnvReady,
}: {
  hasWhatsAppId: boolean;
  whatsappEnvReady: boolean;
}) {
  if (hasWhatsAppId && whatsappEnvReady) {
    return "Phone number ID e variaveis do WhatsApp foram encontrados.";
  }

  if (hasWhatsAppId) {
    return "Phone number ID salvo; faltam variaveis seguras do WhatsApp no ambiente.";
  }

  if (whatsappEnvReady) {
    return "Ambiente possui variaveis; salve o phone number ID da organizacao.";
  }

  return "Faltam phone number ID e variaveis seguras do WhatsApp.";
}

function getPixChecklistDescription({
  hasPixSetup,
  mercadoPagoReady,
  pixAllowed,
}: {
  hasPixSetup: boolean;
  mercadoPagoReady: boolean;
  pixAllowed: boolean;
}) {
  if (hasPixSetup && mercadoPagoReady && pixAllowed) {
    return "Pix registrado no onboarding e Mercado Pago pronto no ambiente.";
  }

  if (!pixAllowed) {
    return "Plano atual nao libera Pix; considere upgrade antes do go-live.";
  }

  if (!mercadoPagoReady) {
    return "Faltam variaveis do Mercado Pago no ambiente de producao.";
  }

  return "Registre a regra de uso do Pix no onboarding.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
