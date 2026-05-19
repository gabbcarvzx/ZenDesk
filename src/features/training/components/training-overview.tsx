import {
  Bot,
  MessageSquareText,
  PlayCircle,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeploymentChecklist } from "@/features/training/components/deployment-checklist";
import { toggleDemoModeAction } from "@/features/training/actions";
import { onboardingSteps, trainingQuickLinks } from "@/features/training/data";
import type { TrainingPageData } from "@/features/training/types";
import { routes } from "@/lib/routes";

export function TrainingOverview({ data }: { data: TrainingPageData }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface px-5 py-5 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Treinamento do cliente
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Central de implantacao da {data.organizationName}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Onboarding, checklist, ajuda contextual, modo demo e tutoriais para o
              cliente implantar o WhatsApp com IA sem depender do suporte.
            </p>
          </div>
          <ButtonLink href={routes.onboarding}>
            <PlayCircle aria-hidden="true" className="mr-2 size-4" />
            Continuar onboarding
          </ButtonLink>
        </div>
      </section>

      {data.loadError ? (
        <div className="rounded-lg border border-[#ffd8d3] bg-[#fff1f0] px-4 py-3 text-sm font-medium text-danger">
          {data.loadError}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        {trainingQuickLinks.map((link) => (
          <ButtonLink
            className="h-auto justify-start px-4 py-4 text-left"
            href={link.href}
            key={link.href}
            variant="outline"
          >
            {link.label}
          </ButtonLink>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <DeploymentChecklist checklist={data.checklist} />
        <TrainingCurriculum />
      </section>

      <DemoModePanel data={data} />
    </div>
  );
}

function TrainingCurriculum() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trilha de aprendizagem</CardTitle>
        <p className="mt-2 text-sm leading-6 text-muted">
          Conteudo organizado na mesma ordem da implantacao para usuarios leigos.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {onboardingSteps.map((step) => (
            <article className="rounded-lg border border-border p-4" key={step.id}>
              <div className="flex items-start gap-3">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-sm font-semibold text-primary">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{step.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DemoModePanel({ data }: { data: TrainingPageData }) {
  const enabled = data.demo.enabled;

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Modo demo</CardTitle>
              <Badge className={enabled ? "bg-[#ecfdf3] text-[#067647]" : undefined}>
                {enabled ? "Ativo" : "Opcional"}
              </Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Use dados simulados para demonstrar fluxo de conversas, clientes,
              pagamentos e IA antes de existirem dados reais no tenant.
            </p>
          </div>
          <form action={toggleDemoModeAction}>
            <input name="enabled" type="hidden" value={enabled ? "false" : "true"} />
            <Button type="submit" variant={enabled ? "outline" : "primary"}>
              {enabled ? "Desativar demo" : "Ativar demo"}
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 pt-5 xl:grid-cols-2">
        <DemoBlock
          icon={<MessageSquareText aria-hidden="true" className="size-5" />}
          title="Conversas simuladas"
        >
          {data.demo.conversations.map((conversation) => (
            <div className="rounded-lg border border-border p-3" key={conversation.customer}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{conversation.customer}</p>
                <Badge>{conversation.status}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{conversation.lastMessage}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                Proximo passo: {conversation.nextAction}
              </p>
            </div>
          ))}
        </DemoBlock>

        <DemoBlock
          icon={<UsersRound aria-hidden="true" className="size-5" />}
          title="Clientes simulados"
        >
          {data.demo.customers.map((customer) => (
            <div className="rounded-lg border border-border p-3" key={customer.name}>
              <p className="font-semibold text-foreground">{customer.name}</p>
              <p className="mt-1 text-sm text-muted">{customer.interest}</p>
              <Badge className="mt-3">{customer.stage}</Badge>
            </div>
          ))}
        </DemoBlock>

        <DemoBlock
          icon={<ReceiptText aria-hidden="true" className="size-5" />}
          title="Pagamentos simulados"
        >
          {data.demo.payments.map((payment) => (
            <div className="rounded-lg border border-border p-3" key={payment.customer}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{payment.customer}</p>
                <p className="font-mono text-sm font-semibold text-foreground">
                  {payment.amount}
                </p>
              </div>
              <Badge className="mt-3">{payment.status}</Badge>
            </div>
          ))}
        </DemoBlock>

        <DemoBlock
          icon={<Bot aria-hidden="true" className="size-5" />}
          title="IA simulada"
        >
          <div className="space-y-3">
            {data.demo.aiMessages.map((message, index) => (
              <div
                className={
                  message.sender === "IA"
                    ? "ml-8 rounded-lg bg-[#e5f2ee] p-3"
                    : "mr-8 rounded-lg border border-border p-3"
                }
                key={`${message.sender}-${index}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  {message.sender}
                </p>
                <p className="mt-1 text-sm leading-6 text-foreground">{message.body}</p>
              </div>
            ))}
          </div>
        </DemoBlock>
      </CardContent>
    </Card>
  );
}

function DemoBlock({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-surface-muted text-primary">
          {icon}
        </span>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}
