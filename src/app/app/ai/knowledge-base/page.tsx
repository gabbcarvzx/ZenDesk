import type { Metadata } from "next";
import { KnowledgeBaseCreateForm } from "@/features/ai/knowledge-base/components/knowledge-base-create-form";
import { KnowledgeBaseExamples } from "@/features/ai/knowledge-base/components/knowledge-base-examples";
import { KnowledgeBaseList } from "@/features/ai/knowledge-base/components/knowledge-base-list";
import { KnowledgeBaseShell } from "@/features/ai/knowledge-base/components/knowledge-base-shell";
import { KnowledgeBaseWarning } from "@/features/ai/knowledge-base/components/knowledge-base-warning";
import { getKnowledgeBasePageData } from "@/features/ai/knowledge-base/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Base de conhecimento da IA",
};

export default async function KnowledgeBasePage() {
  const data = await getKnowledgeBasePageData();

  return (
    <KnowledgeBaseShell
      description="Ensine regras, respostas e detalhes operacionais para a IA responder melhor sem misturar dados entre organizacoes."
      title="Base de conhecimento da IA"
    >
      <KnowledgeBaseWarning message={data.loadError} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <KnowledgeBaseCreateForm canManage={data.canManage} />
          <KnowledgeBaseList canManage={data.canManage} items={data.items} />
        </div>
        <KnowledgeBaseExamples />
      </div>
    </KnowledgeBaseShell>
  );
}
