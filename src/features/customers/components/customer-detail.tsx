import {
  CalendarDays,
  Clock3,
  MessageSquareText,
  NotebookText,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomerEditForm } from "@/features/customers/components/customer-edit-form";
import {
  CustomerStatusBadge,
  formatDateTime,
  formatSource,
} from "@/features/customers/components/customer-list";
import type {
  Customer,
  CustomerAppointment,
  CustomerConversation,
} from "@/features/customers/types";

export function CustomerDetail({
  appointments,
  canManage,
  conversations,
  customer,
}: {
  appointments: CustomerAppointment[];
  canManage: boolean;
  conversations: CustomerConversation[];
  customer: Customer | null;
}) {
  if (!customer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do cliente</CardTitle>
          <CardDescription>
            Selecione ou crie um cliente para ver historicos e observacoes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-muted">
            Nenhum cliente selecionado.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{customer.name}</CardTitle>
                <CustomerStatusBadge status={customer.status} />
              </div>
              <CardDescription>
                Origem {formatSource(customer.source)} · criado em{" "}
                {formatDateTime(customer.createdAt)}
              </CardDescription>
            </div>
            <Badge>tenant scoped</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <InfoItem label="Telefone" value={customer.phone || "Nao informado"} />
            <InfoItem label="Email" value={customer.email || "Nao informado"} />
            <InfoItem
              label="Ultimo contato"
              value={formatDateTime(customer.lastContactAt)}
            />
            <InfoItem label="Origem" value={formatSource(customer.source)} />
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Tag aria-hidden="true" className="size-4 text-primary" />
              Tags
            </div>
            {customer.tags.length ? (
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma tag cadastrada.</p>
            )}
          </div>
          <div className="mt-5 rounded-lg border border-border bg-surface-muted p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <NotebookText aria-hidden="true" className="size-4 text-primary" />
              Observacoes internas
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
              {customer.notes || "Sem observacoes internas."}
            </p>
          </div>
          <div className="mt-5">
            <CustomerEditForm canManage={canManage} customer={customer} />
          </div>
        </CardContent>
      </Card>

      <ConversationHistory conversations={conversations} />
      <AppointmentHistory appointments={appointments} />
    </div>
  );
}

function ConversationHistory({
  conversations,
}: {
  conversations: CustomerConversation[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquareText aria-hidden="true" className="size-5 text-primary" />
          <CardTitle>Historico de conversas</CardTitle>
        </div>
        <CardDescription>
          Ultimas conversas associadas ao cliente dentro deste tenant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <EmptyHistory message="Nenhuma conversa vinculada a este cliente." />
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <article className="rounded-lg border border-border p-4" key={conversation.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{formatChannel(conversation.channel)}</Badge>
                    <Badge className="bg-[#f3f5f7] text-muted">
                      {formatConversationStatus(conversation.status)}
                    </Badge>
                  </div>
                  <span className="font-mono text-xs text-muted">
                    {formatDateTime(conversation.lastMessageAt ?? conversation.createdAt)}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {conversation.messages.length ? (
                    conversation.messages.map((message) => (
                      <div
                        className="rounded-md bg-surface-muted px-3 py-2 text-sm"
                        key={message.id}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                            {formatSender(message.senderType)}
                          </span>
                          <span className="font-mono text-xs text-muted">
                            {formatDateTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="leading-6 text-foreground">{message.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">
                      Conversa sem mensagens registradas.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentHistory({
  appointments,
}: {
  appointments: CustomerAppointment[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="size-5 text-primary" />
          <CardTitle>Historico de agendamentos</CardTitle>
        </div>
        <CardDescription>
          Agenda do cliente para acompanhar recorrencia, faltas e oportunidades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <EmptyHistory message="Nenhum agendamento registrado para este cliente." />
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <article
                className="rounded-lg border border-border bg-surface-muted p-4"
                key={appointment.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      {appointment.serviceName || "Servico nao informado"}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted">
                      <Clock3 aria-hidden="true" className="size-4" />
                      {formatDateTime(appointment.startAt)}
                    </p>
                  </div>
                  <Badge>{formatAppointmentStatus(appointment.status)}</Badge>
                </div>
                {appointment.notes ? (
                  <p className="mt-3 text-sm leading-6 text-muted">{appointment.notes}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function EmptyHistory({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-muted p-6 text-center text-sm text-muted">
      {message}
    </div>
  );
}

function formatChannel(channel: CustomerConversation["channel"]) {
  const labels = {
    manual: "Manual",
    web: "Web",
    whatsapp: "WhatsApp",
  } as const;

  return labels[channel];
}

function formatConversationStatus(status: CustomerConversation["status"]) {
  const labels = {
    closed: "Fechada",
    open: "Aberta",
    waiting_customer: "Aguardando cliente",
    waiting_human: "Aguardando humano",
  } as const;

  return labels[status];
}

function formatSender(senderType: string) {
  const labels: Record<string, string> = {
    ai: "IA",
    customer: "Cliente",
    system: "Sistema",
    user: "Atendente",
  };

  return labels[senderType] ?? senderType;
}

function formatAppointmentStatus(status: CustomerAppointment["status"]) {
  const labels = {
    canceled: "Cancelado",
    completed: "Concluido",
    confirmed: "Confirmado",
    no_show: "Faltou",
    requested: "Solicitado",
    scheduled: "Agendado",
  } as const;

  return labels[status];
}
