import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PricingSection } from "@/features/billing/components/pricing-section";
import { routes } from "@/lib/routes";

export function PricingPreview() {
  return (
    <section id="planos" className="border-t border-border bg-surface px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-primary">Planos</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Comece pequeno, prove valor e escale quando o WhatsApp virar receita.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              Planos preparados para limitar uso de IA, organizar equipe e manter margem conforme a operação cresce.
            </p>
          </div>
          <ButtonLink href={routes.register} variant="outline">
            Testar grátis
            <ArrowRight aria-hidden="true" className="ml-2 size-4" />
          </ButtonLink>
        </div>
        <div className="mt-10">
          <PricingSection />
        </div>
      </div>
    </section>
  );
}
