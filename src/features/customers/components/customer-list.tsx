import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Customer } from "@/features/customers/types";

export function CustomerList({
  customers,
  search,
  selectedCustomerId,
}: {
  customers: Customer[];
  search: string;
  selectedCustomerId?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes</CardTitle>
        <CardDescription>
          Lista isolada por tenant com os principais sinais comerciais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-muted">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => {
              const isSelected = selectedCustomerId === customer.id;

              return (
                <Link
                  className={cn(
                    "block rounded-lg border p-4 transition",
                    isSelected
                      ? "border-primary bg-[#e5f2ee]"
                      : "border-border bg-surface hover:bg-surface-muted",
                  )}
                  href={buildCustomerHref(customer.id, search)}
                  key={customer.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{customer.name}</h3>
                        <CustomerStatusBadge status={customer.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone aria-hidden="true" className="size-4" />
                          {customer.phone || "Sem telefone"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Mail aria-hidden="true" className="size-4" />
                          {customer.email || "Sem email"}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      {formatSource(customer.source)}
                    </span>
                  </div>
                  {customer.tags.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {customer.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                      {customer.tags.length > 4 ? (
                        <Badge>+{customer.tags.length - 4}</Badge>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="mt-3 font-mono text-xs text-muted">
                    Ultimo contato: {formatDateTime(customer.lastContactAt)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CustomerStatusBadge({ status }: { status: Customer["status"] }) {
  const classes =
    status === "customer"
      ? "bg-[#ecfdf3] text-[#067647]"
      : status === "inactive"
        ? "bg-[#f3f5f7] text-muted"
        : "bg-[#fff7ed] text-[#b54708]";

  const label =
    status === "customer" ? "Cliente" : status === "inactive" ? "Inativo" : "Lead";

  return <Badge className={classes}>{label}</Badge>;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "nao informado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatSource(source: string) {
  const labels: Record<string, string> = {
    indicacao: "Indicacao",
    instagram: "Instagram",
    manual: "Manual",
    web: "Web",
    whatsapp: "WhatsApp",
  };

  return labels[source] ?? source;
}

function buildCustomerHref(customerId: string, search: string) {
  const params = new URLSearchParams({ customer: customerId });

  if (search) {
    params.set("q", search);
  }

  return `${routes.customers}?${params.toString()}`;
}
