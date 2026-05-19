import {
  Bot,
  CalendarCheck,
  CreditCard,
  Handshake,
  Library,
  ShieldCheck,
} from "lucide-react";
import { benefits } from "@/features/marketing/data";

const benefitIcons = [
  Bot,
  CalendarCheck,
  CreditCard,
  Handshake,
  Library,
  ShieldCheck,
] as const;

export function BenefitsSection() {
  return (
    <section id="beneficios" className="bg-[#f7f8fb] px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-primary">Benefícios</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Menos conversa perdida, mais venda acontecendo no painel.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted">
            A plataforma junta o que o pequeno negócio precisa para transformar atendimento em operação comercial.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefitIcons[index];

            return (
              <article className="rounded-lg border border-border bg-surface p-6 shadow-sm" key={benefit.title}>
                <div className="grid size-11 place-items-center rounded-lg bg-[#e5f2ee] text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
