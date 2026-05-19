import { ButtonLink } from "@/components/ui/button";
import { PricingSection } from "@/features/billing/components/pricing-section";
import { routes } from "@/lib/routes";

export function PricingPreview() {
  return (
    <section className="border-t border-border bg-[#f7f8fb] px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Monetizacao
            </span>
            <h2 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
              Planos pensados para margem, limite de IA e crescimento previsivel.
            </h2>
          </div>
          <ButtonLink href={routes.pricing} variant="outline">
            Comparar planos
          </ButtonLink>
        </div>
        <div className="mt-10">
          <PricingSection />
        </div>
      </div>
    </section>
  );
}
