import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pricingPlans } from "@/features/billing/data";
import { routes } from "@/lib/routes";

export function PricingSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {pricingPlans.map((plan) => (
        <Card
          className={
            plan.highlighted
              ? "relative border-primary shadow-lg shadow-primary/10"
              : "relative"
          }
          key={plan.slug}
        >
          {plan.highlighted ? (
            <div className="absolute -top-3 left-5">
              <Badge>Mais escolhido</Badge>
            </div>
          ) : null}
          <CardHeader className={plan.highlighted ? "pt-7" : undefined}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </div>
            </div>
            <div className="mt-6 flex items-end gap-1">
              <span className="text-4xl font-semibold text-foreground">{plan.price}</span>
              <span className="pb-1 text-sm font-medium text-muted">/mês</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted">
              {plan.features.map((feature) => (
                <li className="flex gap-2" key={feature}>
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <ButtonLink
              className="mt-6 w-full"
              href={routes.register}
              variant={plan.highlighted ? "primary" : "outline"}
            >
              Começar teste grátis
            </ButtonLink>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
