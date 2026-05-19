import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PricingSection } from "@/features/billing/components/pricing-section";
import { planComparisonRows } from "@/features/billing/data";
import { routes } from "@/lib/routes";

const pricingHeroBullets = [
  "IA treinada com dados do negócio",
  "Playground antes de conectar o canal real",
  "Handoff humano para conversas sensíveis",
] as const;

export const metadata: Metadata = {
  title: "Preços",
  description:
    "Planos comerciais para transformar o WhatsApp em atendimento, agenda e vendas com IA.",
};

export default function PricingPage() {
  return (
    <>
      <section className="bg-[#0b1f1a] px-6 py-20 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase text-[#95d5c3]">
              Planos comerciais
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
              Escolha o plano ideal para vender mais pelo WhatsApp com IA.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d7e5df]">
              Comece com atendimento inteligente, evolua para agenda e Pix, e escale com automações de recuperação quando o volume crescer.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                className="bg-[#f08a4b] text-white hover:bg-[#d97745]"
                href={routes.register}
                size="lg"
              >
                Começar teste grátis
                <ArrowRight aria-hidden="true" className="ml-2 size-5" />
              </ButtonLink>
              <ButtonLink
                className="border-white/30 bg-white/10 text-white hover:bg-white/15"
                href="#comparacao"
                size="lg"
                variant="outline"
              >
                Comparar planos
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3 text-[#95d5c3]">
              <MessageCircle aria-hidden="true" className="size-5" />
              <p className="text-sm font-semibold">Para negócios que atendem no WhatsApp</p>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[#d7e5df]">
              {pricingHeroBullets.map((item) => (
                <li className="flex gap-2" key={item}>
                  <CheckCircle2 aria-hidden="true" className="mt-1 size-4 shrink-0 text-[#95d5c3]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f8fb] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PricingSection />
        </div>
      </section>

      <section id="comparacao" className="border-y border-border bg-surface px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-primary">Comparação</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Compare os recursos antes de escolher.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              O Starter valida atendimento com IA. O Pro concentra venda, agenda e Pix. O Business foi pensado para volume, equipe e recuperação ativa.
            </p>
          </div>
          <div className="mt-10 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-[#eef4f1] text-foreground">
                  <tr>
                    <th className="w-[32%] px-5 py-4 font-semibold">Recurso</th>
                    <th className="px-5 py-4 font-semibold">Starter</th>
                    <th className="px-5 py-4 font-semibold text-primary">Pro</th>
                    <th className="px-5 py-4 font-semibold">Business</th>
                  </tr>
                </thead>
                <tbody>
                  {planComparisonRows.map((row) => (
                    <tr className="border-t border-border" key={row.feature}>
                      <td className="px-5 py-4 font-medium text-foreground">{row.feature}</td>
                      <td className="px-5 py-4 text-muted">{row.starter}</td>
                      <td className="px-5 py-4 font-medium text-foreground">{row.pro}</td>
                      <td className="px-5 py-4 text-muted">{row.business}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0f6b5f] px-6 py-16 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Teste a IA antes de conectar o WhatsApp real.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#d7e5df]">
              Crie sua conta, cadastre o contexto do negócio e simule conversas no playground.
            </p>
          </div>
          <ButtonLink
            className="bg-white text-primary hover:bg-[#eef4f1] lg:min-w-56"
            href={routes.register}
            size="lg"
          >
            Começar teste grátis
            <ArrowRight aria-hidden="true" className="ml-2 size-5" />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
