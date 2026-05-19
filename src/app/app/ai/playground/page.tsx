import type { Metadata } from "next";
import { PlaygroundClient } from "@/features/ai/playground/components/playground-client";
import { PlaygroundShell } from "@/features/ai/playground/components/playground-shell";
import { getAiPlaygroundPageData } from "@/features/ai/playground/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Playground da IA",
};

export default async function AiPlaygroundPage({
  searchParams,
}: {
  searchParams?: Promise<{ conversation?: string }>;
}) {
  const params = await searchParams;
  const data = await getAiPlaygroundPageData(params?.conversation);

  return (
    <PlaygroundShell
      description="Teste respostas comerciais da IA com dados reais do negocio antes de conectar canais externos."
      title="Playground da IA"
    >
      <PlaygroundClient {...data} />
    </PlaygroundShell>
  );
}
