import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden border-r border-border bg-[#f1f6f4] px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <BrandLogo />
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            SaaS multi-tenant
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground">
            Operacao comercial por conversa, preparada para crescer com seguranca.
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            Acesso por organizacao, isolamento por tenant e base pronta para
            Supabase Auth, billing e limites de plano.
          </p>
        </div>
        <p className="text-sm text-muted">
          Codinome interno: Zendesk. Marca publica a definir.
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        {children}
      </section>
    </main>
  );
}
