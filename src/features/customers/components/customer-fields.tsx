import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  customerSourceOptions,
  customerStatusOptions,
  formatDateTimeInput,
  formatTagsInput,
} from "@/features/customers/schema";
import type { Customer } from "@/features/customers/types";

export function CustomerFields({
  customer,
  disabled,
  errors,
  idPrefix,
}: {
  customer?: Customer;
  disabled: boolean;
  errors?: Record<string, string[] | undefined>;
  idPrefix: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Nome</Label>
        <Input
          defaultValue={customer?.name ?? ""}
          disabled={disabled}
          id={`${idPrefix}-name`}
          name="name"
          placeholder="Nome completo"
          required
        />
        <FieldError error={errors?.name?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-status`}>Status</Label>
        <Select
          defaultValue={customer?.status ?? "lead"}
          disabled={disabled}
          id={`${idPrefix}-status`}
          name="status"
        >
          {customerStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <FieldError error={errors?.status?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-phone`}>Telefone</Label>
        <Input
          defaultValue={customer?.phone ?? ""}
          disabled={disabled}
          id={`${idPrefix}-phone`}
          inputMode="tel"
          name="phone"
          placeholder="+55 11 99999-9999"
        />
        <FieldError error={errors?.phone?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input
          defaultValue={customer?.email ?? ""}
          disabled={disabled}
          id={`${idPrefix}-email`}
          inputMode="email"
          name="email"
          placeholder="cliente@email.com"
          type="email"
        />
        <FieldError error={errors?.email?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-source`}>Origem</Label>
        <Select
          defaultValue={customer?.source ?? "manual"}
          disabled={disabled}
          id={`${idPrefix}-source`}
          name="source"
        >
          {customerSourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <FieldError error={errors?.source?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-last-contact`}>Ultimo contato</Label>
        <Input
          defaultValue={formatDateTimeInput(customer?.lastContactAt ?? null)}
          disabled={disabled}
          id={`${idPrefix}-last-contact`}
          name="lastContactAt"
          type="datetime-local"
        />
        <FieldError error={errors?.lastContactAt?.[0]} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-tags`}>Tags</Label>
        <Input
          defaultValue={customer ? formatTagsInput(customer.tags) : ""}
          disabled={disabled}
          id={`${idPrefix}-tags`}
          name="tags"
          placeholder="vip, recorrente, alta intencao"
        />
        <p className="text-xs leading-5 text-muted">
          Separe por virgula. Tags ajudam segmentacao, campanhas e priorizacao comercial.
        </p>
        <FieldError error={errors?.tags?.[0]} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-notes`}>Observacoes internas</Label>
        <Textarea
          defaultValue={customer?.notes ?? ""}
          disabled={disabled}
          id={`${idPrefix}-notes`}
          name="notes"
          placeholder="Preferencias, contexto comercial, restricoes e combinados internos."
        />
        <FieldError error={errors?.notes?.[0]} />
      </div>
    </>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="text-sm font-medium text-danger">{error}</p> : null;
}
