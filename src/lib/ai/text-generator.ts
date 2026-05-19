import { generateText, type LanguageModel } from "ai";
import type {
  AiGenerationUsage,
  AiTextGeneratorInput,
  AiTextGeneratorResult,
} from "@/lib/ai/types";

export const DEFAULT_AI_MODEL = "openai/gpt-5.4" satisfies LanguageModel;
export const DEFAULT_TEMPERATURE = 0.35;
export const DEFAULT_MAX_OUTPUT_TOKENS = 500;

export async function generateWithAiSdk(
  input: AiTextGeneratorInput,
): Promise<AiTextGeneratorResult> {
  const result = await generateText({
    maxOutputTokens: input.maxOutputTokens,
    messages: input.messages,
    model: input.model as LanguageModel,
    system: input.system,
    temperature: input.temperature,
  });

  return {
    finishReason: result.finishReason,
    text: result.text,
    usage: mapUsage(result.usage),
  };
}

export function getModelName(model: LanguageModel) {
  return typeof model === "string" ? model : "custom-language-model";
}

function mapUsage(usage: unknown): AiGenerationUsage | undefined {
  if (!usage || typeof usage !== "object") {
    return undefined;
  }

  const record = usage as Record<string, unknown>;

  return {
    inputTokens: toNumber(record.inputTokens),
    outputTokens: toNumber(record.outputTokens),
    totalTokens: toNumber(record.totalTokens),
  };
}

function toNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}
