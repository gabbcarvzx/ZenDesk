import type { Metadata } from "next";
import { PricingSection } from "@/features/billing/components/pricing-section";

export const metadata: Metadata = {
  title: "Precos",
  description: "Planos iniciais para validar atendimento, vendas e recuperacao de clientes com IA.",
};

export default function PricingPage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-20 lg:px-8">
      <div className="max-w-3xl">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Planos
        </span>
        <h1 className="mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
          Comece pequeno, cresca com previsibilidade de custo.
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted">
          A estrutura comercial foi pensada para limitar uso de IA por organizacao,
          proteger margem e permitir evolucao para Mercado Pago sem refatorar o
          modelo de billing.
        </p>
      </div>
      <PricingSection />
    </section>
  );
}
