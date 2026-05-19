import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  appointmentStatusOptions,
  formatDateTimeInput,
} from "@/features/appointments/schema";
import type {
  Appointment,
  AppointmentCustomerOption,
  AppointmentServiceOption,
} from "@/features/appointments/types";

export function AppointmentFields({
  appointment,
  customers,
  disabled,
  errors,
  idPrefix,
  services,
}: {
  appointment?: Appointment;
  customers: AppointmentCustomerOption[];
  disabled: boolean;
  errors?: Record<string, string[] | undefined>;
  idPrefix: string;
  services: AppointmentServiceOption[];
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-customer`}>Cliente</Label>
        <Select
          defaultValue={appointment?.customerId ?? ""}
          disabled={disabled || !customers.length}
          id={`${idPrefix}-customer`}
          name="customerId"
          required
        >
          <option value="">Selecione um cliente</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </option>
          ))}
        </Select>
        <FieldError error={errors?.customerId?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-service`}>Servico</Label>
        <Select
          defaultValue={appointment?.serviceId ?? ""}
          disabled={disabled}
          id={`${idPrefix}-service`}
          name="serviceId"
        >
          <option value="">Sem servico vinculado</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
              {service.durationMinutes ? ` · ${service.durationMinutes} min` : ""}
            </option>
          ))}
        </Select>
        <FieldError error={errors?.serviceId?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-start`}>Inicio</Label>
        <Input
          defaultValue={formatDateTimeInput(appointment?.startAt ?? null)}
          disabled={disabled}
          id={`${idPrefix}-start`}
          name="scheduledStartAt"
          required
          type="datetime-local"
        />
        <FieldError error={errors?.scheduledStartAt?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-end`}>Fim opcional</Label>
        <Input
          defaultValue={formatDateTimeInput(appointment?.endAt ?? null)}
          disabled={disabled}
          id={`${idPrefix}-end`}
          name="scheduledEndAt"
          type="datetime-local"
        />
        <p className="text-xs leading-5 text-muted">
          Se vazio, a criacao usa a duracao do servico quando existir.
        </p>
        <FieldError error={errors?.scheduledEndAt?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-status`}>Status</Label>
        <Select
          defaultValue={appointment?.status ?? "scheduled"}
          disabled={disabled}
          id={`${idPrefix}-status`}
          name="status"
        >
          {appointmentStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <FieldError error={errors?.status?.[0]} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-notes`}>Observacoes</Label>
        <Textarea
          defaultValue={appointment?.notes ?? ""}
          disabled={disabled}
          id={`${idPrefix}-notes`}
          name="notes"
          placeholder="Preferencias, observacoes internas ou combinados."
        />
        <FieldError error={errors?.notes?.[0]} />
      </div>
    </>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="text-sm font-medium text-danger">{error}</p> : null;
}
