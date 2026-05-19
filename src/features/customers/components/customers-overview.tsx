import { UsersRound, UserCheck, UserRoundX } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Customer } from "@/features/customers/types";

export function CustomersOverview({ customers }: { customers: Customer[] }) {
  const leads = customers.filter((customer) => customer.status === "lead").length;
  const activeCustomers = customers.filter(
    (customer) => customer.status === "customer",
  ).length;
  const inactive = customers.filter((customer) => customer.status === "inactive").length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        description="Base exibida na busca atual"
        icon={<UsersRound aria-hidden="true" className="size-5" />}
        label="Clientes listados"
        value={String(customers.length)}
      />
      <MetricCard
        description={`${leads} leads em acompanhamento`}
        icon={<UserCheck aria-hidden="true" className="size-5" />}
        label="Clientes ativos"
        value={String(activeCustomers)}
      />
      <MetricCard
        description="Contatos sem prioridade comercial"
        icon={<UserRoundX aria-hidden="true" className="size-5" />}
        label="Inativos"
        value={String(inactive)}
      />
    </div>
  );
}

function MetricCard({
  description,
  icon,
  label,
  value,
}: {
  description: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted">{description}</p>
        </div>
        <span className="rounded-lg bg-[#e5f2ee] p-2 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
