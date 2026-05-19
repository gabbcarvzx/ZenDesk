import { Banknote, Clock3, ReceiptText } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/features/payments/schema";
import type { Payment } from "@/features/payments/types";

export function PaymentsOverview({ payments }: { payments: Payment[] }) {
  const pendingAmount = payments
    .filter((payment) => payment.status === "pending")
    .reduce((total, payment) => total + payment.amountCents, 0);
  const paidAmount = payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + payment.amountCents, 0);
  const expired = payments.filter((payment) => payment.status === "expired").length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        description="Cobrancas ainda em aberto"
        icon={<Clock3 aria-hidden="true" className="size-5" />}
        label="Pendente"
        value={formatCurrency(pendingAmount)}
      />
      <MetricCard
        description="Receita registrada como paga"
        icon={<Banknote aria-hidden="true" className="size-5" />}
        label="Pago"
        value={formatCurrency(paidAmount)}
      />
      <MetricCard
        description="Cobrancas vencidas ou expiradas"
        icon={<ReceiptText aria-hidden="true" className="size-5" />}
        label="Expiradas"
        value={String(expired)}
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
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 break-words text-2xl font-semibold text-foreground">
            {value}
          </p>
          <p className="mt-2 text-sm text-muted">{description}</p>
        </div>
        <span className="rounded-lg bg-[#e5f2ee] p-2 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
