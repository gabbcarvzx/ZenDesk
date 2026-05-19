import { CalendarCheck, CreditCard, MessageCircle, UserRoundCheck } from "lucide-react";

export function ProductMockupsSection() {
  return (
    <section id="painel" className="bg-[#f7f8fb] px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-primary">Painel</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Um painel para testar, assumir e acompanhar a IA vendendo.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted">
            Os mockups abaixo mostram a experiência central: conversa com IA, controle humano, agenda, cobrança e visão de clientes.
          </p>
        </div>
        <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DashboardMockup />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
            <ChatMockup />
            <AgendaPaymentMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Central comercial</p>
          <p className="mt-1 text-xs text-muted">Hoje, 19 de maio</p>
        </div>
        <div className="flex gap-2">
          <span className="size-3 rounded-full bg-[#d97745]" />
          <span className="size-3 rounded-full bg-primary" />
          <span className="size-3 rounded-full bg-[#172033]" />
        </div>
      </div>
      <div className="grid min-h-[430px] md:grid-cols-[180px_1fr]">
        <aside className="hidden border-r border-border bg-[#102c26] p-4 text-sm text-white md:block">
          {["Dashboard", "Conversas", "Clientes", "Agenda", "Pagamentos", "IA"].map((item) => (
            <div className="rounded-md px-3 py-2 first:bg-white/10" key={item}>
              {item}
            </div>
          ))}
        </aside>
        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["38", "abertas"],
              ["12", "aguardando humano"],
              ["21", "leads capturados"],
              ["R$ 4.820", "em cobranças"],
            ].map(([value, label]) => (
              <div className="rounded-lg border border-border bg-[#fbfcfd] p-4" key={label}>
                <p className="text-xl font-semibold text-foreground">{value}</p>
                <p className="mt-1 text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-border">
            {[
              ["Ana Paula", "IA ofereceu pacote mensal", "Venda"],
              ["Diego Martins", "Atendente assumiu negociação", "Humano"],
              ["Renata Lima", "Agendamento confirmado", "Agenda"],
              ["Carlos Nunes", "Pix pendente enviado", "Cobrança"],
            ].map(([name, summary, status]) => (
              <div className="grid gap-3 border-b border-border px-4 py-4 text-sm last:border-0 md:grid-cols-[130px_1fr_100px]" key={name}>
                <span className="font-semibold text-foreground">{name}</span>
                <span className="text-muted">{summary}</span>
                <span className="font-semibold text-primary">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <MessageCircle aria-hidden="true" className="size-5 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Conversa com IA</p>
          <p className="text-xs text-muted">Modo IA ativo</p>
        </div>
      </div>
      <div className="mt-5 space-y-3 text-sm">
        <Bubble text="Quanto custa o procedimento?" />
        <Bubble align="right" text="Temos opções a partir dos valores cadastrados. Quer que eu indique a melhor para você?" />
        <Bubble text="Quero agendar avaliação." />
        <Bubble align="right" text="Claro. Tenho horários amanhã. Posso confirmar seu nome e telefone?" />
      </div>
    </div>
  );
}

function AgendaPaymentMockup() {
  const rows = [
    {
      description: "Amanhã, 16h",
      icon: CalendarCheck,
      status: "Confirmado",
      title: "Agenda",
    },
    {
      description: "Pix de R$ 197,00",
      icon: CreditCard,
      status: "Pendente",
      title: "Pagamento",
    },
    {
      description: "Lead qualificado",
      icon: UserRoundCheck,
      status: "Contato salvo",
      title: "Cliente",
    },
  ] as const;

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="grid gap-4">
        {rows.map(({ description, icon: Icon, status, title }) => (
          <div className="flex items-center gap-4 rounded-lg border border-border bg-[#fbfcfd] p-4" key={title}>
            <div className="grid size-10 place-items-center rounded-lg bg-[#e5f2ee] text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-xs text-muted">{description}</p>
            </div>
            <p className="text-xs font-semibold text-primary">{status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bubble({
  align = "left",
  text,
}: {
  align?: "left" | "right";
  text: string;
}) {
  return (
    <div className={align === "right" ? "flex justify-end" : ""}>
      <p
        className={
          align === "right"
            ? "max-w-[260px] rounded-lg bg-primary px-3 py-2 text-primary-foreground"
            : "max-w-[260px] rounded-lg bg-[#eef4f1] px-3 py-2 text-[#344054]"
        }
      >
        {text}
      </p>
    </div>
  );
}
