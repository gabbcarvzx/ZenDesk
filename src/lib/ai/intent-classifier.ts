import type { LanguageModel } from "ai";
import {
  DEFAULT_AI_MODEL,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_TEMPERATURE,
  generateWithAiSdk,
} from "./text-generator";
import type {
  AiIntent,
  AiIntentClassification,
  AiIntentEntities,
  AiTextGenerator,
  BuildAiPromptInput,
} from "./types";

const validIntents: AiIntent[] = [
  "ask_question",
  "product_recommendation",
  "appointment_request",
  "payment_request",
  "human_handoff",
  "customer_update",
  "unknown",
];

export type ClassifyIntentOptions = {
  generator?: AiTextGenerator;
  maxOutputTokens?: number;
  model?: LanguageModel;
  temperature?: number;
};

export async function classifyIntent(
  input: BuildAiPromptInput,
  options: ClassifyIntentOptions = {},
): Promise<AiIntentClassification> {
  const generator = options.generator ?? generateWithAiSdk;
  const model = options.model ?? DEFAULT_AI_MODEL;

  try {
    const result = await generator({
      maxOutputTokens: options.maxOutputTokens ?? 350,
      messages: [
        {
          content: buildClassifierUserMessage(input),
          role: "user",
        },
      ],
      model,
      system: buildClassifierSystemPrompt(),
      temperature: options.temperature ?? 0,
    });
    const parsed = parseClassification(result.text);

    if (parsed) {
      return mergeWithHeuristicSafety(parsed, input);
    }
  } catch {
    // Heuristic fallback keeps the pipeline available when the model is unavailable.
  }

  return classifyIntentHeuristically(input);
}

export function classifyIntentHeuristically(
  input: BuildAiPromptInput,
): AiIntentClassification {
  const message = normalize(input.currentCustomerMessage);
  const clearCustomerConfirmation = hasClearCustomerConfirmation(input);
  const entities = extractHeuristicEntities(input);
  const intent = detectIntent(message, entities);

  return {
    clearCustomerConfirmation,
    confidence: intent === "unknown" ? 0.25 : 0.68,
    entities,
    intent,
    reason: "heuristic_classification",
  };
}

export function hasClearCustomerConfirmation(input: BuildAiPromptInput) {
  const message = normalize(input.currentCustomerMessage);

  if (
    /\b(confirmo|confirmado|pode criar|pode gerar|pode agendar|pode marcar|pode mandar|fechado|combinado|autorizo|quero sim|vou pagar|pode fazer)\b/i.test(
      message,
    )
  ) {
    return true;
  }

  if (!/^(sim|ok|pode|isso|perfeito|beleza|fechado|confirmo)[!. ]*$/i.test(message)) {
    return false;
  }

  const lastAssistantMessage = [...(input.conversationHistory ?? [])]
    .reverse()
    .find((historyMessage) => historyMessage.role !== "customer");

  if (!lastAssistantMessage) {
    return false;
  }

  return /\b(confirmar|confirma|posso|quer que eu|gerar|criar|agendar|marcar|cobranca|cobrança|pix|pagamento)\b/i.test(
    normalize(lastAssistantMessage.content),
  );
}

function buildClassifierSystemPrompt() {
  return [
    "Voce classifica intencoes de clientes para um SaaS de atendimento comercial.",
    "Responda somente JSON valido, sem markdown.",
    "Intencoes permitidas: ask_question, product_recommendation, appointment_request, payment_request, human_handoff, customer_update, unknown.",
    "clearCustomerConfirmation so pode ser true quando o cliente confirma claramente criar cobranca, criar agendamento ou executar acao.",
    "Nunca invente datas, valores, servicos ou confirmacoes.",
    "Schema:",
    JSON.stringify({
      clearCustomerConfirmation: "boolean",
      confidence: "number 0..1",
      entities: {
        appointment: {
          notes: "string|null",
          scheduledEndAt: "ISO string|null",
          scheduledStartAt: "ISO string|null",
          serviceName: "string|null",
        },
        customerUpdate: {
          email: "string|null",
          name: "string|null",
          notes: "string|null",
          phone: "string|null",
        },
        payment: {
          amountCents: "number|null",
          description: "string|null",
          method: "pix|card|cash|other|null",
        },
      },
      intent: "AiIntent",
      reason: "string",
    }),
  ].join("\n");
}

function buildClassifierUserMessage(input: BuildAiPromptInput) {
  const history = (input.conversationHistory ?? [])
    .slice(-6)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
  const services = (input.services ?? [])
    .slice(0, 20)
    .map((service) => service.name)
    .join(", ");
  const products = (input.products ?? [])
    .slice(0, 20)
    .map((product) => product.name)
    .join(", ");

  return [
    `Mensagem atual: ${input.currentCustomerMessage}`,
    `Historico recente:\n${history || "sem historico"}`,
    `Servicos conhecidos: ${services || "nenhum"}`,
    `Produtos conhecidos: ${products || "nenhum"}`,
    `Cliente conhecido: ${input.customer?.name ?? "nao informado"}`,
  ].join("\n\n");
}

function parseClassification(text: string): AiIntentClassification | null {
  const jsonText = extractJson(text);

  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const intent = validIntents.includes(parsed.intent as AiIntent)
      ? (parsed.intent as AiIntent)
      : "unknown";

    return {
      clearCustomerConfirmation: parsed.clearCustomerConfirmation === true,
      confidence: clampConfidence(parsed.confidence),
      entities: normalizeEntities(parsed.entities),
      intent,
      reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 240) : undefined,
    };
  } catch {
    return null;
  }
}

function mergeWithHeuristicSafety(
  classification: AiIntentClassification,
  input: BuildAiPromptInput,
): AiIntentClassification {
  const heuristicConfirmation = hasClearCustomerConfirmation(input);

  return {
    ...classification,
    clearCustomerConfirmation:
      classification.clearCustomerConfirmation && heuristicConfirmation,
    confidence: clampNumber(classification.confidence, 0, 1),
  };
}

function normalizeEntities(value: unknown): AiIntentEntities {
  if (!isRecord(value)) {
    return {};
  }

  return {
    appointment: isRecord(value.appointment)
      ? {
          notes: normalizeOptionalString(value.appointment.notes),
          scheduledEndAt: normalizeOptionalIsoDate(value.appointment.scheduledEndAt),
          scheduledStartAt: normalizeOptionalIsoDate(value.appointment.scheduledStartAt),
          serviceName: normalizeOptionalString(value.appointment.serviceName),
        }
      : null,
    customerUpdate: isRecord(value.customerUpdate)
      ? {
          email: normalizeOptionalEmail(value.customerUpdate.email),
          name: normalizeOptionalString(value.customerUpdate.name),
          notes: normalizeOptionalString(value.customerUpdate.notes),
          phone: normalizeOptionalString(value.customerUpdate.phone),
        }
      : null,
    payment: isRecord(value.payment)
      ? {
          amountCents: normalizeOptionalPositiveInteger(value.payment.amountCents),
          description: normalizeOptionalString(value.payment.description),
          method: normalizePaymentMethod(value.payment.method),
        }
      : null,
  };
}

function extractHeuristicEntities(input: BuildAiPromptInput): AiIntentEntities {
  const message = input.currentCustomerMessage;
  const paymentAmount = extractAmountCents(message);
  const appointmentDate = extractIsoDate(message);
  const email = extractEmail(message);
  const phone = extractPhone(message);

  return {
    appointment: appointmentDate
      ? {
          scheduledStartAt: appointmentDate,
          serviceName: findMentionedServiceName(message, input.services ?? []),
        }
      : null,
    customerUpdate:
      email || phone
        ? {
            email,
            phone,
          }
        : null,
    payment: paymentAmount
      ? {
          amountCents: paymentAmount,
          description: "Cobranca solicitada pelo cliente",
          method: /pix/i.test(message) ? "pix" : "other",
        }
      : null,
  };
}

function detectIntent(message: string, entities: AiIntentEntities): AiIntent {
  if (/\b(humano|atendente|pessoa|gerente|reclamar|reclamacao|reclamação)\b/i.test(message)) {
    return "human_handoff";
  }

  if (entities.customerUpdate || /\b(meu email|meu e-mail|meu telefone|meu nome)\b/i.test(message)) {
    return "customer_update";
  }

  if (/\b(pagar|pagamento|pix|cobranca|cobrança|boleto|cartao|cartão|link de pagamento)\b/i.test(message)) {
    return "payment_request";
  }

  if (/\b(agendar|marcar|horario|horário|agenda|consulta|reuniao|reunião)\b/i.test(message)) {
    return "appointment_request";
  }

  if (/\b(recomenda|recomendacao|recomendação|indica|melhor produto|qual produto|qual servico|qual serviço)\b/i.test(message)) {
    return "product_recommendation";
  }

  if (message.includes("?") || /\b(quanto|quando|onde|como|qual|tem|funciona)\b/i.test(message)) {
    return "ask_question";
  }

  return "unknown";
}

function extractJson(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);

  return match?.[0] ?? null;
}

function extractAmountCents(message: string) {
  const match =
    message.match(/R\$\s*(\d{1,6}(?:[.,]\d{2})?)/i) ??
    message.match(/\b(\d{1,6}(?:[.,]\d{2})?)\s*(?:reais|real)\b/i);

  if (!match?.[1]) {
    return null;
  }

  const amount = Number(match[1].replace(/\./g, "").replace(",", "."));

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function extractIsoDate(message: string) {
  const isoMatch = message.match(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d{3})?Z?\b/);

  if (isoMatch?.[0]) {
    return toValidIso(isoMatch[0]);
  }

  const brMatch = message.match(/\b(\d{2})\/(\d{2})\/(\d{4})\s+(?:as|às)?\s*(\d{1,2}):(\d{2})\b/i);

  if (!brMatch) {
    return null;
  }

  return toValidIso(`${brMatch[3]}-${brMatch[2]}-${brMatch[1]}T${brMatch[4].padStart(2, "0")}:${brMatch[5]}:00`);
}

function toValidIso(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extractEmail(message: string) {
  return message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function extractPhone(message: string) {
  return message.match(/(?:\+?55\s*)?\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/)?.[0] ?? null;
}

function findMentionedServiceName(
  message: string,
  services: Array<{ name: string }>,
) {
  const normalizedMessage = normalize(message);

  return (
    services.find((service) => normalizedMessage.includes(normalize(service.name)))?.name ??
    null
  );
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : null;
}

function normalizeOptionalEmail(value: unknown) {
  const text = normalizeOptionalString(value);

  return text && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : null;
}

function normalizeOptionalIsoDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return toValidIso(value);
}

function normalizeOptionalPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function normalizePaymentMethod(value: unknown) {
  return value === "pix" || value === "card" || value === "cash" || value === "other"
    ? value
    : null;
}

function clampConfidence(value: unknown) {
  return typeof value === "number" ? clampNumber(value, 0, 1) : 0.5;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const defaultIntentClassifierLimits = {
  maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
  temperature: DEFAULT_TEMPERATURE,
} as const;
