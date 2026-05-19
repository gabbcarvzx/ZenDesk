"use client";

import { useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, PlusCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createManualPaymentAction } from "@/features/payments/actions";
import { PaymentFields } from "@/features/payments/components/payment-fields";
import { PaymentStatusMessage } from "@/features/payments/components/payment-status-message";
import {
  formatCurrency,
  initialPaymentActionState,
} from "@/features/payments/schema";
import type {
  PaymentConversationSummary,
  PaymentCustomerOption,
} from "@/features/payments/types";

type PixPaymentResponse = {
  amountCents: number;
  checkoutUrl: string | null;
  currency: string;
  description: string | null;
  dueAt: string | null;
  id: string;
  provider: string;
  providerPaymentId: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  status: string;
};

type PixState = {
  message?: string;
  payment?: PixPaymentResponse;
  status: "idle" | "loading" | "success" | "error";
};

export function PaymentCreateForm({
  canManage,
  conversations,
  customers,
}: {
  canManage: boolean;
  conversations: PaymentConversationSummary[];
  customers: PaymentCustomerOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pixState, setPixState] = useState<PixState>({ status: "idle" });
  const [state, action, isPending] = useActionState(
    createManualPaymentAction,
    initialPaymentActionState,
  );
  const isPixPending = pixState.status === "loading";
  const disabled = !canManage || isPending || isPixPending || !customers.length;

  async function handleCreatePixCharge() {
    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    const customerId = getFormString(formData, "customerId");
    const customer = customers.find((item) => item.id === customerId);
    const method = getFormString(formData, "method");
    const amountCents = parseAmountToCents(getFormString(formData, "amount"));
    const description = getFormString(formData, "description").trim();
    const conversationId = getFormString(formData, "conversationId") || null;
    const dueAt = parseDueAt(getFormString(formData, "dueAt"));

    if (!customer || !amountCents || !description) {
      setPixState({
        message: "Informe cliente, valor e descricao antes de criar o Pix.",
        status: "error",
      });
      return;
    }

    if (method !== "pix") {
      setPixState({
        message: "Selecione o metodo Pix para criar cobranca Mercado Pago.",
        status: "error",
      });
      return;
    }

    if (!customer.email) {
      setPixState({
        message: "O cliente precisa ter email cadastrado para criar Pix no Mercado Pago.",
        status: "error",
      });
      return;
    }

    if (dueAt === "invalid") {
      setPixState({
        message: "Informe um vencimento valido ou deixe o campo em branco.",
        status: "error",
      });
      return;
    }

    setPixState({
      message: "Criando cobranca Pix no Mercado Pago...",
      status: "loading",
    });

    try {
      const response = await fetch("/api/payments/mercadopago/create", {
        body: JSON.stringify({
          amountCents,
          conversationId,
          customerId: customer.id,
          description,
          dueAt,
          idempotencyKey: createClientIdempotencyKey(),
          payerEmail: customer.email,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await safeJson(response)) as
        | { error?: string; payment?: PixPaymentResponse }
        | null;

      if (!response.ok || !payload?.payment) {
        setPixState({
          message: payload?.error ?? "Nao foi possivel criar o Pix.",
          status: "error",
        });
        return;
      }

      setPixState({
        message: "Pix criado e salvo com sucesso.",
        payment: payload.payment,
        status: "success",
      });
      router.refresh();
    } catch {
      setPixState({
        message: "Falha de comunicacao ao criar Pix.",
        status: "error",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar cobranca</CardTitle>
        <CardDescription>
          Registre cobrancas manuais ou gere um Pix real pelo Mercado Pago quando a
          integracao estiver configurada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!customers.length ? (
          <div className="mb-4">
            <PaymentStatusMessage
              message="Cadastre um cliente antes de criar cobrancas."
              tone="info"
            />
          </div>
        ) : null}
        {!canManage && customers.length ? (
          <div className="mb-4">
            <PaymentStatusMessage
              message="Pagamentos Pix estao disponiveis nos planos Pro e Business."
              tone="info"
            />
          </div>
        ) : null}
        <form ref={formRef} action={action} className="grid gap-4 md:grid-cols-2">
          {state.message ? (
            <div className="md:col-span-2">
              <PaymentStatusMessage
                message={state.message}
                tone={state.status === "success" ? "success" : "error"}
              />
            </div>
          ) : null}
          {pixState.message ? (
            <div className="md:col-span-2">
              <PaymentStatusMessage
                message={pixState.message}
                tone={
                  pixState.status === "success"
                    ? "success"
                    : pixState.status === "error"
                      ? "error"
                      : "info"
                }
              />
            </div>
          ) : null}
          <PaymentFields
            conversations={conversations}
            customers={customers}
            disabled={disabled}
            errors={state.fieldErrors}
            idPrefix="create-payment"
          />
          {pixState.payment ? (
            <div className="md:col-span-2">
              <PixResult payment={pixState.payment} />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button className="gap-2" disabled={disabled} type="submit">
              <PlusCircle aria-hidden="true" className="size-4" />
              {isPending ? "Criando..." : "Criar cobranca manual"}
            </Button>
            <Button
              className="gap-2"
              disabled={disabled}
              onClick={handleCreatePixCharge}
              type="button"
              variant="secondary"
            >
              <QrCode aria-hidden="true" className="size-4" />
              {isPixPending ? "Gerando Pix..." : "Criar Pix Mercado Pago"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PixResult({ payment }: { payment: PixPaymentResponse }) {
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-surface-muted p-4 md:grid-cols-[160px_1fr]">
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-border bg-surface">
        {payment.qrCodeBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="QR code Pix"
            className="size-36 object-contain"
            src={getQrCodeImageSource(payment.qrCodeBase64)}
          />
        ) : (
          <QrCode aria-hidden="true" className="size-12 text-muted" />
        )}
      </div>
      <div className="min-w-0 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(payment.amountCents)} - status {payment.status}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {payment.description ?? "Cobranca Pix Mercado Pago"}
          </p>
        </div>
        {payment.checkoutUrl ? (
          <a
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            href={payment.checkoutUrl}
            rel="noreferrer"
            target="_blank"
          >
            Abrir link de pagamento
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        ) : null}
        {payment.qrCode ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Codigo Pix copia e cola
            </p>
            <textarea
              className="min-h-24 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
              readOnly
              value={payment.qrCode}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function parseAmountToCents(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function parseDueAt(value: string) {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "invalid" : date.toISOString();
}

function createClientIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getQrCodeImageSource(value: string) {
  return value.startsWith("data:") ? value : `data:image/png;base64,${value}`;
}
