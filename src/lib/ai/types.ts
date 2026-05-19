export type AiToneOfVoice = "profissional" | "amigavel" | "vendedor" | "informal";

export type AiCatalogStatus = "active" | "inactive" | "archived" | "draft";

export type AiBusinessContext = {
  address?: string | null;
  businessHours?: string | null;
  cancellationPolicy?: string | null;
  description?: string | null;
  googleMapsUrl?: string | null;
  humanHandoffMessage?: string | null;
  importantRules?: string | null;
  instagramUrl?: string | null;
  name: string;
  niche?: string | null;
  primaryLanguage?: string | null;
  tenantId: string;
  toneOfVoice?: AiToneOfVoice | null;
  welcomeMessage?: string | null;
};

export type AiProductContext = {
  id?: string | null;
  category?: string | null;
  currency?: string | null;
  description?: string | null;
  name: string;
  priceCents?: number | null;
  status?: AiCatalogStatus | null;
  stockQuantity?: number | null;
  tenantId: string;
};

export type AiServiceContext = {
  id?: string | null;
  category?: string | null;
  currency?: string | null;
  description?: string | null;
  durationMinutes?: number | null;
  name: string;
  priceCents?: number | null;
  status?: AiCatalogStatus | null;
  tenantId: string;
};

export type AiKnowledgeBaseContext = {
  category?: string | null;
  content: string;
  priority?: number | null;
  status?: AiCatalogStatus | null;
  tenantId: string;
  title: string;
};

export type AiCustomerContext = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  tenantId: string;
};

export type AiConversationMessageRole = "customer" | "ai" | "human";

export type AiConversationMessage = {
  content: string;
  createdAt?: string | null;
  role: AiConversationMessageRole;
  tenantId: string;
};

export type AiPromptMessage = {
  content: string;
  role: "assistant" | "user";
};

export type BuildAiPromptInput = {
  business: AiBusinessContext;
  conversationHistory?: AiConversationMessage[];
  currentCustomerMessage: string;
  customer?: AiCustomerContext | null;
  knowledgeBase?: AiKnowledgeBaseContext[];
  products?: AiProductContext[];
  services?: AiServiceContext[];
  tenantId: string;
};

export type BuildAiPromptOptions = {
  maxHistoryMessages?: number;
  maxKnowledgeItems?: number;
  maxProducts?: number;
  maxServices?: number;
};

export type AiPromptMetadata = {
  activeKnowledgeItems: number;
  activeProducts: number;
  activeServices: number;
  historyMessages: number;
  tenantId: string;
};

export type AiPrompt = {
  messages: AiPromptMessage[];
  metadata: AiPromptMetadata;
  system: string;
};

export type AiGenerationUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AiTextGeneratorInput = {
  maxOutputTokens: number;
  messages: AiPromptMessage[];
  model: unknown;
  system: string;
  temperature: number;
};

export type AiTextGeneratorResult = {
  finishReason?: string;
  text: string;
  usage?: AiGenerationUsage;
};

export type AiTextGenerator = (
  input: AiTextGeneratorInput,
) => Promise<AiTextGeneratorResult>;

export type AiIntent =
  | "ask_question"
  | "product_recommendation"
  | "appointment_request"
  | "payment_request"
  | "human_handoff"
  | "customer_update"
  | "unknown";

export type AiAppointmentIntentEntities = {
  notes?: string | null;
  scheduledEndAt?: string | null;
  scheduledStartAt?: string | null;
  serviceName?: string | null;
};

export type AiPaymentIntentEntities = {
  amountCents?: number | null;
  description?: string | null;
  method?: "pix" | "card" | "cash" | "other" | null;
};

export type AiCustomerUpdateIntentEntities = {
  email?: string | null;
  name?: string | null;
  notes?: string | null;
  phone?: string | null;
};

export type AiIntentEntities = {
  appointment?: AiAppointmentIntentEntities | null;
  customerUpdate?: AiCustomerUpdateIntentEntities | null;
  payment?: AiPaymentIntentEntities | null;
};

export type AiIntentClassification = {
  clearCustomerConfirmation: boolean;
  confidence: number;
  entities: AiIntentEntities;
  intent: AiIntent;
  reason?: string;
};

export type AiInternalToolName =
  | "create_appointment"
  | "create_payment"
  | "update_customer"
  | "request_human"
  | "none";

export type AiActionDecisionStatus =
  | "approved"
  | "blocked"
  | "not_applicable";

export type AiCreateAppointmentToolInput = {
  conversationId?: string | null;
  customerId: string;
  notes?: string | null;
  scheduledEndAt?: string | null;
  scheduledStartAt: string;
  serviceId?: string | null;
};

export type AiCreatePaymentToolInput = {
  amountCents: number;
  conversationId?: string | null;
  customerId: string;
  description: string;
  dueAt?: string | null;
  method: "pix" | "card" | "cash" | "other";
};

export type AiUpdateCustomerToolInput = {
  customerId: string;
  email?: string | null;
  name?: string | null;
  notes?: string | null;
  phone?: string | null;
};

export type AiRequestHumanToolInput = {
  conversationId: string;
  customerId?: string | null;
  reason: string;
  requestedByMessageId?: string | null;
};

export type AiActionDecision = {
  input?:
    | AiCreateAppointmentToolInput
    | AiCreatePaymentToolInput
    | AiRequestHumanToolInput
    | AiUpdateCustomerToolInput;
  reason: string;
  status: AiActionDecisionStatus;
  tool: AiInternalToolName;
};

export type AiToolExecutionStatus = "executed" | "failed" | "skipped";

export type AiToolResult = {
  data?: Record<string, unknown>;
  message?: string;
  status: AiToolExecutionStatus;
  tool: AiInternalToolName;
};

export type AiToolExecutionContext = {
  allowAppointmentCreation?: boolean;
  allowCustomerUpdate?: boolean;
  allowHumanHandoff?: boolean;
  allowPaymentCreation?: boolean;
  conversationId?: string | null;
  customerId?: string | null;
  organizationId: string;
  requestedByMessageId?: string | null;
  source?: string;
  supabase?: unknown;
};

export type AiRespondStatus = "generated" | "handoff";

export type AiRespondResult = {
  actionDecision?: AiActionDecision;
  finishReason?: string;
  handoffReason?: "empty_model_response" | "model_error";
  intentClassification?: AiIntentClassification;
  model: string;
  promptMetadata: AiPromptMetadata;
  status: AiRespondStatus;
  text: string;
  toolResults?: AiToolResult[];
  usage?: AiGenerationUsage;
};
