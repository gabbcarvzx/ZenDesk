import { runAiPipeline, type RunAiPipelineOptions } from "@/lib/ai/pipeline";
import type { AiRespondResult, BuildAiPromptInput } from "@/lib/ai/types";

export type RespondToCustomerOptions = RunAiPipelineOptions;

export async function respondToCustomer(
  input: BuildAiPromptInput,
  options: RespondToCustomerOptions = {},
): Promise<AiRespondResult> {
  return runAiPipeline(input, options);
}
