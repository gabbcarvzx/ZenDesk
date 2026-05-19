import { BookOpenCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const knowledgeExamples = [
  "Perguntas frequentes",
  "Regras da empresa",
  "Formas de pagamento",
  "Politicas de entrega",
  "Detalhes de servicos",
  "Promocoes",
] as const;

export function KnowledgeBaseExamples() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <BookOpenCheck aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
          <div>
            <CardTitle>Conteudos recomendados</CardTitle>
            <CardDescription>
              Use itens curtos e objetivos para compor o contexto futuro da IA por tenant.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {knowledgeExamples.map((example) => (
            <div
              className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm font-medium text-foreground"
              key={example}
            >
              {example}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
