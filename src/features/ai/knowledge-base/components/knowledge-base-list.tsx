import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyEducation } from "@/components/ui/empty-education";
import { KnowledgeBaseEditForm } from "@/features/ai/knowledge-base/components/knowledge-base-edit-form";
import type { KnowledgeBaseItem } from "@/features/ai/knowledge-base/types";
import { routes } from "@/lib/routes";

export function KnowledgeBaseList({
  canManage,
  items,
}: {
  canManage: boolean;
  items: KnowledgeBaseItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Base de conhecimento</CardTitle>
        <CardDescription>
          Itens tenant-scoped que serao usados como contexto controlado da IA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyEducation
            action={{ href: routes.ai, label: "Cadastrar conhecimento" }}
            benefit="A base de conhecimento evita respostas genericas e mantem regras importantes dentro do tenant."
            icon={<BookOpen aria-hidden="true" className="size-5" />}
            title="Nenhum conhecimento cadastrado"
            tutorial="Comece com perguntas frequentes, politicas de cancelamento, regras de desconto e detalhes dos servicos mais vendidos."
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article className="rounded-lg border border-border p-4" key={item.id}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <Badge
                        className={
                          item.status === "active"
                            ? "bg-[#ecfdf3] text-[#067647]"
                            : "bg-[#f3f5f7] text-muted"
                        }
                      >
                        {item.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                      {item.category ? <Badge>{item.category}</Badge> : null}
                    </div>
                    <p className="mt-2 max-h-36 overflow-auto whitespace-pre-line text-sm leading-6 text-muted">
                      {item.content}
                    </p>
                  </div>
                  <div className="shrink-0 text-left lg:text-right">
                    <p className="text-sm font-semibold text-foreground">
                      Prioridade {item.priority}
                    </p>
                    <p className="mt-1 text-sm text-muted">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <KnowledgeBaseEditForm canManage={canManage} item={item} />
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}
