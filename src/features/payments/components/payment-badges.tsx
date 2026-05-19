import { Badge } from "@/components/ui/badge";
import {
  formatPaymentMethod,
  formatPaymentStatus,
} from "@/features/payments/schema";
import type { PaymentMethod, PaymentStatus } from "@/features/payments/types";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const className =
    status === "paid"
      ? "bg-[#ecfdf3] text-[#067647]"
      : status === "canceled"
        ? "bg-[#fff1f0] text-danger"
        : status === "expired"
          ? "bg-[#eef2f6] text-muted"
          : "bg-[#fff7ed] text-[#b54708]";

  return <Badge className={className}>{formatPaymentStatus(status)}</Badge>;
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return <Badge>{formatPaymentMethod(method)}</Badge>;
}

export function formatPaymentDateTime(value: string | null) {
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
