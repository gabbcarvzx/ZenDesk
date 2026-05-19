import type { ReactNode } from "react";

export const onboardingStepIds = [
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
] as const;

export type OnboardingStepId = (typeof onboardingStepIds)[number];

export type OnboardingFieldType = "text" | "textarea" | "select";

export type OnboardingField = {
  example: string;
  help: string;
  label: string;
  name: keyof OnboardingPayload;
  options?: ReadonlyArray<{ label: string; value: string }>;
  placeholder: string;
  required?: boolean;
  type: OnboardingFieldType;
};

export type OnboardingStep = {
  businessImpact: string;
  description: string;
  fields: readonly OnboardingField[];
  id: OnboardingStepId;
  nextLabel: string;
  number: number;
  title: string;
};

export type AiTone = "profissional" | "amigavel" | "vendedor" | "informal";

export type OnboardingPayload = {
  aiTestExpectedAnswer?: string;
  aiTestScenario?: string;
  businessDescription?: string;
  businessHours?: string;
  businessName?: string;
  catalogSummary?: string;
  humanHandoffMessage?: string;
  importantRules?: string;
  niche?: string;
  pixInstructions?: string;
  pixKey?: string;
  pixProvider?: "mercado_pago" | "manual";
  toneOfVoice?: AiTone;
  welcomeMessage?: string;
  whatsappPhoneNumberId?: string;
};

export type OnboardingProgress = {
  completedAt: string | null;
  completedSteps: OnboardingStepId[];
  currentStep: OnboardingStepId;
  demoModeEnabled: boolean;
  payload: OnboardingPayload;
};

export type ChecklistStatus = "done" | "warning" | "missing";

export type DeploymentChecklistItem = {
  actionHref?: string;
  actionLabel?: string;
  businessImpact: string;
  description: string;
  id: string;
  label: string;
  status: ChecklistStatus;
};

export type DeploymentChecklist = {
  completedCount: number;
  items: DeploymentChecklistItem[];
  percentage: number;
  totalCount: number;
};

export type TrainingPageData = {
  checklist: DeploymentChecklist;
  demo: DemoModeData;
  loadError?: string;
  onboarding: OnboardingProgress;
  organizationName: string;
};

export type OnboardingPageData = {
  checklist: DeploymentChecklist;
  canManage: boolean;
  loadError?: string;
  onboarding: OnboardingProgress;
  organizationName: string;
};

export type HelpCategoryId =
  | "getting-started"
  | "business-settings"
  | "ai-settings"
  | "whatsapp"
  | "payments"
  | "conversations"
  | "human-handoff"
  | "common-issues"
  | "security"
  | "plans-billing";

export type HelpArticle = {
  categoryId: HelpCategoryId;
  example: string;
  id: string;
  readMinutes: number;
  steps: string[];
  summary: string;
  title: string;
};

export type HelpCategory = {
  description: string;
  id: HelpCategoryId;
  title: string;
};

export type DemoConversation = {
  customer: string;
  lastMessage: string;
  nextAction: string;
  status: string;
};

export type DemoCustomer = {
  interest: string;
  name: string;
  stage: string;
};

export type DemoPayment = {
  amount: string;
  customer: string;
  status: string;
};

export type DemoAiMessage = {
  body: string;
  sender: "Cliente" | "IA";
};

export type DemoModeData = {
  aiMessages: DemoAiMessage[];
  conversations: DemoConversation[];
  customers: DemoCustomer[];
  enabled: boolean;
  payments: DemoPayment[];
};

export type TourArea =
  | "dashboard"
  | "conversations"
  | "ai"
  | "customers"
  | "payments"
  | "settings";

export type TourStep = {
  body: string;
  targetId: string;
  title: string;
};

export type IntelligentEmptyStateAction = {
  href: string;
  label: string;
};

export type IntelligentEmptyStateProps = {
  action?: IntelligentEmptyStateAction;
  benefit: string;
  icon: ReactNode;
  title: string;
  tutorial: string;
};
