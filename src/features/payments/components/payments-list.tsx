import {
  CalendarClock,
  CheckCircle2,
  MessageCircle,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyEducation } from "@/components/ui/empty-education";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PaymentMethodBadge,
  PaymentStatusBadge,
  formatPaymentDateTime,
} from "@/features/payments/components/payment-badges";
import { formatCurrency } from "@/features/payments/schema";
import type { Payment } from "@/features/payments/types";
import { routes } from "@/lib/routes";

export function PaymentsList({ payments }: { payments: Payment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cobrancas</CardTitle>
        <CardDescription>
          Pagamentos tenant-scoped com cliente, conversa, valor e metodo registrados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <EmptyEducation
            action={{ href: routes.payments, label: "Criar cobranca" }}
            benefit="Cobrancas vinculadas ao cliente transformam atendimento em receita rastreavel e reduzem conferencias manuais."
            icon={<ReceiptText aria-hidden="true" className="size-5" />}
            title="Nenhuma cobranca criada"
            tutorial="Crie a primeira cobranca com cliente, valor e descricao. Para Pix automatico, confirme Mercado Pago e plano antes do go-live."
          />
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <article className="rounded-lg border border-border p-4" key={payment.id}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ReceiptText aria-hidden="true" className="size-5 text-primary" />
                      <h3 className="break-words font-semibold text-foreground">
                        {payment.description ?? "Cobranca manual"}
                      </h3>
                      <PaymentStatusBadge status={payment.status} />
                      <PaymentMethodBadge method={payment.method} />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-2">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <UserRound aria-hidden="true" className="size-4 shrink-0" />
                        <span className="truncate">
                          {payment.customer?.name ?? "Cliente nao encontrado"}
                        </span>
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
                        <span className="truncate">
                          Vence: {formatPaymentDateTime(payment.dueAt)}
                        </span>
                      </span>
                      {payment.conversationId ? (
                        <span className="inline-flex min-w-0 items-center gap-2 md:col-span-2">
                          <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
                          <span className="truncate">
                            Conversa {payment.conversationId.slice(0, 8)}
                            {payment.conversation?.customerName
                              ? ` - ${payment.conversation.customerName}`
                              : ""}
                          </span>
                        </span>
                      ) : null}
                      {payment.paidAt ? (
                        <span className="inline-flex min-w-0 items-center gap-2 md:col-span-2">
                          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
                          <span className="truncate">
                            Pago em {formatPaymentDateTime(payment.paidAt)}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-left lg:text-right">
                    <p className="text-xl font-semibold text-foreground">
                      {formatCurrency(payment.amountCents)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 lg:justify-end">
                      <Badge>{payment.provider}</Badge>
                      <Badge>{payment.currency}</Badge>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
