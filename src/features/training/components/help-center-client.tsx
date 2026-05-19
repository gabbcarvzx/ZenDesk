"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { helpArticles, helpCategories } from "@/features/training/data";
import type { HelpCategoryId } from "@/features/training/types";
import { cn } from "@/lib/utils";

export function HelpCenterClient() {
  const [activeCategory, setActiveCategory] = useState<HelpCategoryId>("getting-started");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredArticles = useMemo(() => {
    return helpArticles.filter((article) => {
      const matchesCategory = article.categoryId === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        [article.title, article.summary, article.example, ...article.steps]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, normalizedQuery]);
  const activeCategoryData =
    helpCategories.find((category) => category.id === activeCategory) ?? helpCategories[0];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface px-5 py-5 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Central de ajuda
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Guias simples para implantar o sistema
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Artigos escritos para usuarios nao tecnicos, com passo a passo,
              exemplos reais e foco em operacao comercial.
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar artigo, exemplo ou problema"
              value={query}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted">
              Encontre ajuda pelo momento da implantacao.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {helpCategories.map((category) => (
              <button
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left transition",
                  activeCategory === category.id
                    ? "border-primary bg-[#e5f2ee]"
                    : "border-border hover:bg-surface-muted",
                )}
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                type="button"
              >
                <span className="block font-semibold text-foreground">{category.title}</span>
                <span className="mt-1 block text-sm leading-6 text-muted">
                  {category.description}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <BookOpen aria-hidden="true" className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                {activeCategoryData.title}
              </h3>
              <Badge>{filteredArticles.length} artigos</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              {activeCategoryData.description}
            </p>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-muted">
              Nenhum artigo encontrado para esta busca.
            </div>
          ) : (
            filteredArticles.map((article) => (
              <Card key={article.id}>
                <CardHeader className="border-b border-border">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <CardTitle>{article.title}</CardTitle>
                      <p className="mt-2 text-sm leading-6 text-muted">{article.summary}</p>
                    </div>
                    <Badge>{article.readMinutes} min</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
                        Passo a passo
                      </h4>
                      <ol className="mt-3 space-y-3">
                        {article.steps.map((step, index) => (
                          <li className="flex gap-3 text-sm leading-6 text-muted" key={step}>
                            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-xs font-semibold text-primary">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="rounded-lg border border-border bg-surface-muted p-4">
                      <h4 className="text-sm font-semibold text-foreground">Exemplo real</h4>
                      <p className="mt-2 text-sm leading-6 text-muted">{article.example}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
