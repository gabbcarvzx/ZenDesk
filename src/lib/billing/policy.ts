import type { SupabaseClient } from "@supabase/supabase-js";

export type BillingPlanSlug = "starter" | "pro" | "business";

export type BillingFeature =
  | "advancedAi"
  | "appointments"
  | "basicAi"
  | "crm"
  | "humanHandoff"
  | "multipleAgents"
  | "pixPayments"
  | "playground"
  | "productsAndServices"
  | "recoveryAutomations"
  | "advancedAnalytics"
  | "prioritySupport";

export type BillingPlan = {
  agentSeatLimit: number;
  features: Record<BillingFeature, boolean>;
  messageLimit: number;
  name: string;
  priceCents: number;
  slug: BillingPlanSlug;
  whatsappNumberLimit: number;
};

export type BillingPolicyCheck = {
  allowed: boolean;
  feature?: BillingFeature;
  limit?: number;
  message: string;
  plan: BillingPlan;
  remaining?: number;
  usage?: number;
};

type SupabaseLike = Pick<SupabaseClient, "from">;

export class BillingPolicyError extends Error {
  readonly check: BillingPolicyCheck;
  readonly code:
    | "feature_not_in_plan"
    | "monthly_message_limit_exceeded"
    | "plan_not_found";

  constructor(
    code: BillingPolicyError["code"],
    check: BillingPolicyCheck,
  ) {
    super(check.message);
    this.name = "BillingPolicyError";
    this.code = code;
    this.check = check;
  }
}

export const billingPlans = {
  starter: {
    agentSeatLimit: 1,
    features: {
      advancedAi: false,
      advancedAnalytics: false,
      appointments: false,
      basicAi: true,
      crm: false,
      humanHandoff: false,
      multipleAgents: false,
      pixPayments: false,
      playground: true,
      prioritySupport: false,
      productsAndServices: true,
      recoveryAutomations: false,
    },
    messageLimit: 500,
    name: "Starter",
    priceCents: 7900,
    slug: "starter",
    whatsappNumberLimit: 1,
  },
  pro: {
    agentSeatLimit: 3,
    features: {
      advancedAi: true,
      advancedAnalytics: false,
      appointments: true,
      basicAi: true,
      crm: true,
      humanHandoff: true,
      multipleAgents: true,
      pixPayments: true,
      playground: true,
      prioritySupport: false,
      productsAndServices: true,
      recoveryAutomations: false,
    },
    messageLimit: 3_000,
    name: "Pro",
    priceCents: 19_900,
    slug: "pro",
    whatsappNumberLimit: 1,
  },
  business: {
    agentSeatLimit: 20,
    features: {
      advancedAi: true,
      advancedAnalytics: true,
      appointments: true,
      basicAi: true,
      crm: true,
      humanHandoff: true,
      multipleAgents: true,
      pixPayments: true,
      playground: true,
      prioritySupport: true,
      productsAndServices: true,
      recoveryAutomations: true,
    },
    messageLimit: 15_000,
    name: "Business",
    priceCents: 49_900,
    slug: "business",
    whatsappNumberLimit: 3,
  },
} satisfies Record<BillingPlanSlug, BillingPlan>;

export const billingPlanSlugs = Object.keys(billingPlans) as BillingPlanSlug[];

const featureLabels: Record<BillingFeature, string> = {
  advancedAi: "IA avancada",
  advancedAnalytics: "analytics avancado",
  appointments: "agendamentos",
  basicAi: "IA basica",
  crm: "CRM",
  humanHandoff: "handoff humano",
  multipleAgents: "multiplos atendentes",
  pixPayments: "pagamentos Pix",
  playground: "playground de IA",
  prioritySupport: "suporte prioritario",
  productsAndServices: "produtos e servicos",
  recoveryAutomations: "automacoes de recuperacao",
};

export function normalizeBillingPlanSlug(
  value: string | null | undefined,
): BillingPlanSlug {
  return billingPlanSlugs.includes(value as BillingPlanSlug)
    ? (value as BillingPlanSlug)
    : "starter";
}

export function getBillingPlan(value: string | null | undefined): BillingPlan {
  return billingPlans[normalizeBillingPlanSlug(value)];
}

export function checkFeatureAccess({
  feature,
  planSlug,
}: {
  feature: BillingFeature;
  planSlug: string | null | undefined;
}): BillingPolicyCheck {
  const plan = getBillingPlan(planSlug);
  const allowed = plan.features[feature];

  return {
    allowed,
    feature,
    message: allowed
      ? `${featureLabels[feature]} liberado no plano ${plan.name}.`
      : `${featureLabels[feature]} nao esta incluido no plano ${plan.name}.`,
    plan,
  };
}

export function assertFeatureAccess({
  feature,
  planSlug,
}: {
  feature: BillingFeature;
  planSlug: string | null | undefined;
}) {
  const check = checkFeatureAccess({ feature, planSlug });

  if (!check.allowed) {
    throw new BillingPolicyError("feature_not_in_plan", check);
  }

  return check;
}

export async function assertCanUseFeature({
  feature,
  organizationId,
  planSlug,
  supabase,
}: {
  feature: BillingFeature;
  organizationId: string;
  planSlug?: string | null;
  supabase: SupabaseLike;
}) {
  const resolvedPlanSlug =
    planSlug ?? (await getOrganizationPlanSlug(supabase, organizationId));

  return assertFeatureAccess({
    feature,
    planSlug: resolvedPlanSlug,
  });
}

export async function getOrganizationPlanSlug(
  supabase: SupabaseLike,
  organizationId: string,
): Promise<BillingPlanSlug> {
  const { data, error } = await supabase
    .from("organizations")
    .select("plan_slug")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data as { plan_slug?: string | null } | null;
  return normalizeBillingPlanSlug(row?.plan_slug);
}

export async function checkMonthlyAiMessageLimit({
  incrementBy = 1,
  now = new Date(),
  organizationId,
  planSlug,
  supabase,
}: {
  incrementBy?: number;
  now?: Date;
  organizationId: string;
  planSlug?: string | null;
  supabase: SupabaseLike;
}): Promise<BillingPolicyCheck> {
  const resolvedPlanSlug =
    planSlug ?? (await getOrganizationPlanSlug(supabase, organizationId));
  const plan = getBillingPlan(resolvedPlanSlug);
  const usage = await getMonthlyAiMessageUsage({
    now,
    organizationId,
    supabase,
  });
  const remaining = Math.max(0, plan.messageLimit - usage);
  const allowed = usage + incrementBy <= plan.messageLimit;

  return {
    allowed,
    limit: plan.messageLimit,
    message: allowed
      ? `Uso dentro do limite mensal do plano ${plan.name}.`
      : `Limite mensal de mensagens do plano ${plan.name} atingido.`,
    plan,
    remaining,
    usage,
  };
}

export async function assertWithinMonthlyAiMessageLimit(
  input: Parameters<typeof checkMonthlyAiMessageLimit>[0],
) {
  const check = await checkMonthlyAiMessageLimit(input);

  if (!check.allowed) {
    throw new BillingPolicyError("monthly_message_limit_exceeded", check);
  }

  return check;
}

export async function getMonthlyAiMessageUsage({
  now = new Date(),
  organizationId,
  supabase,
}: {
  now?: Date;
  organizationId: string;
  supabase: SupabaseLike;
}) {
  const { start, end } = getMonthWindow(now);
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("direction", "outbound")
    .eq("sender_type", "ai")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export function getBillingPolicyMessage(error: unknown) {
  if (error instanceof BillingPolicyError) {
    return error.check.message;
  }

  return "Recurso bloqueado pela politica comercial do plano.";
}

function getMonthWindow(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { end, start };
}
