import type { Metadata } from "next";
import { PaymentCreateForm } from "@/features/payments/components/payment-create-form";
import { PaymentStatusMessage } from "@/features/payments/components/payment-status-message";
import { PaymentsList } from "@/features/payments/components/payments-list";
import { PaymentsOverview } from "@/features/payments/components/payments-overview";
import { PaymentsShell } from "@/features/payments/components/payments-shell";
import { getPaymentsPageData } from "@/features/payments/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pagamentos",
};

export default async function PaymentsPage() {
  const data = await getPaymentsPageData();

  return (
    <PaymentsShell
      description="Crie e acompanhe cobrancas manuais por cliente e conversa, com contrato preparado para conectar Mercado Pago sem trocar a UI."
      title="Pagamentos"
    >
      {data.loadError ? <PaymentStatusMessage message={data.loadError} tone="error" /> : null}
      <PaymentsOverview payments={data.payments} />
      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <PaymentCreateForm
          canManage={data.canManage}
          conversations={data.conversations}
          customers={data.customers}
        />
        <PaymentsList payments={data.payments} />
      </div>
    </PaymentsShell>
  );
}
