import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pricingPlans } from "@/features/billing/data";
import { routes } from "@/lib/routes";

export function PricingSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {pricingPlans.map((plan) => (
        <Card className={plan.highlighted ? "border-primary shadow-md" : ""} key={plan.slug}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{plan.name}</CardTitle>
              {plan.highlighted ? <Badge>Recomendado</Badge> : null}
            </div>
            <CardDescription>{plan.description}</CardDescription>
            <div className="mt-5 flex items-end gap-1">
              <span className="text-4xl font-semibold text-foreground">{plan.price}</span>
              <span className="pb-1 text-sm font-medium text-muted">/mes</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted">
              {plan.features.map((feature) => (
                <li className="flex gap-2" key={feature}>
                  <span className="mt-2 size-1.5 rounded-full bg-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <ButtonLink className="mt-6 w-full" href={routes.register} variant={plan.highlighted ? "primary" : "outline"}>
              Iniciar trial
            </ButtonLink>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
