import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  formatDateTimeInput,
  paymentMethodOptions,
  paymentStatusOptions,
} from "@/features/payments/schema";
import type {
  PaymentConversationSummary,
  PaymentCustomerOption,
} from "@/features/payments/types";

export function PaymentFields({
  conversations,
  customers,
  disabled,
  errors,
  idPrefix,
}: {
  conversations: PaymentConversationSummary[];
  customers: PaymentCustomerOption[];
  disabled: boolean;
  errors?: Record<string, string[] | undefined>;
  idPrefix: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-customer`}>Cliente</Label>
        <Select
          disabled={disabled || !customers.length}
          id={`${idPrefix}-customer`}
          name="customerId"
          required
        >
          <option value="">Selecione um cliente</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
              {customer.phone ? ` - ${customer.phone}` : ""}
              {!customer.phone && customer.email ? ` - ${customer.email}` : ""}
            </option>
          ))}
        </Select>
        <FieldError error={errors?.customerId?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-conversation`}>Conversa opcional</Label>
        <Select
          disabled={disabled}
          id={`${idPrefix}-conversation`}
          name="conversationId"
        >
          <option value="">Sem conversa vinculada</option>
          {conversations.map((conversation) => (
            <option key={conversation.id} value={conversation.id}>
              {conversation.customerName ?? "Cliente nao identificado"} -{" "}
              {conversation.channel} - {conversation.id.slice(0, 8)}
            </option>
          ))}
        </Select>
        <p className="text-xs leading-5 text-muted">
          Se selecionar uma conversa de outro cliente, a acao sera bloqueada.
        </p>
        <FieldError error={errors?.conversationId?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-amount`}>Valor</Label>
        <Input
          disabled={disabled}
          id={`${idPrefix}-amount`}
          inputMode="decimal"
          name="amount"
          placeholder="129,90"
          required
        />
        <FieldError error={errors?.amountCents?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-method`}>Metodo</Label>
        <Select
          defaultValue="pix"
          disabled={disabled}
          id={`${idPrefix}-method`}
          name="method"
        >
          {paymentMethodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <FieldError error={errors?.method?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-status`}>Status inicial</Label>
        <Select
          defaultValue="pending"
          disabled={disabled}
          id={`${idPrefix}-status`}
          name="status"
        >
          {paymentStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <FieldError error={errors?.status?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-due-at`}>Vencimento opcional</Label>
        <Input
          defaultValue={formatDateTimeInput(null)}
          disabled={disabled}
          id={`${idPrefix}-due-at`}
          name="dueAt"
          type="datetime-local"
        />
        <FieldError error={errors?.dueAt?.[0]} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Descricao</Label>
        <Textarea
          disabled={disabled}
          id={`${idPrefix}-description`}
          name="description"
          placeholder="Ex.: Sinal do pacote mensal, consulta avulsa ou produto vendido."
          required
        />
        <FieldError error={errors?.description?.[0]} />
      </div>
    </>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="text-sm font-medium text-danger">{error}</p> : null;
}
