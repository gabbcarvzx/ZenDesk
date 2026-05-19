export type PaymentProviderMethod = "pix" | "card" | "cash" | "other";

export type PaymentProviderChargeStatus = "pending" | "paid" | "canceled" | "expired";

export type PaymentProviderChargeMetadata = Record<string, unknown>;

export type CreatePaymentProviderChargeInput = {
  amountCents: number;
  conversationId?: string | null;
  currency?: string;
  customerId: string;
  description: string;
  dueAt?: string | null;
  metadata?: PaymentProviderChargeMetadata;
  method: PaymentProviderMethod;
  organizationId: string;
};

export type CreatePaymentProviderChargeResult = {
  checkoutUrl?: string | null;
  expiresAt?: string | null;
  metadata?: PaymentProviderChargeMetadata;
  provider: string;
  providerPaymentId?: string | null;
  qrCode?: string | null;
  status: PaymentProviderChargeStatus;
};

export type CancelPaymentProviderChargeInput = {
  organizationId: string;
  providerPaymentId: string;
  reason?: string;
};

export type CancelPaymentProviderChargeResult = {
  metadata?: PaymentProviderChargeMetadata;
  status: PaymentProviderChargeStatus;
};

export interface PaymentProvider {
  readonly name: string;
  cancelCharge?(
    input: CancelPaymentProviderChargeInput,
  ): Promise<CancelPaymentProviderChargeResult>;
  createCharge(
    input: CreatePaymentProviderChargeInput,
  ): Promise<CreatePaymentProviderChargeResult>;
}

export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual";

  async createCharge(
    input: CreatePaymentProviderChargeInput,
  ): Promise<CreatePaymentProviderChargeResult> {
    return {
      expiresAt: input.dueAt ?? null,
      metadata: {
        amountCents: input.amountCents,
        conversationId: input.conversationId ?? null,
        currency: input.currency ?? "BRL",
        method: input.method,
        mode: "manual",
        organizationId: input.organizationId,
        ...(input.metadata ?? {}),
      },
      provider: this.name,
      providerPaymentId: null,
      status: "pending",
    };
  }

  async cancelCharge(): Promise<CancelPaymentProviderChargeResult> {
    return {
      metadata: {
        mode: "manual",
      },
      status: "canceled",
    };
  }
}
