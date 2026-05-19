import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-[#eef4f1]">
      <ProductBackdrop />
      <div className="relative mx-auto flex min-h-[82vh] w-full max-w-7xl flex-col justify-center px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Plataforma SaaS para WhatsApp
          </span>
          <h1 className="mt-5 text-5xl font-semibold leading-tight text-foreground sm:text-6xl">
            Atendimento e vendas com IA para pequenos negocios.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#344054]">
            Uma central multi-tenant para responder clientes, qualificar leads,
            organizar follow-ups e preparar cobranca recorrente com controle de uso
            por organizacao.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={routes.register} size="lg">
              Criar conta
            </ButtonLink>
            <ButtonLink href={routes.pricing} size="lg" variant="outline">
              Ver planos
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute bottom-[-72px] right-[-120px] w-[min(860px,75vw)] rounded-lg border border-border bg-surface p-4 shadow-2xl">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="rounded-lg border border-border bg-[#172033] p-4 text-white">
            <div className="h-3 w-28 rounded-md bg-white/35" />
            <div className="mt-8 space-y-3">
              {["Conversas", "Contatos", "Follow-ups", "Billing"].map((item) => (
                <div className="rounded-md bg-white/10 px-3 py-2 text-sm" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {["38 abertas", "14 leads", "7 handoffs"].map((item) => (
                <div className="rounded-lg border border-border bg-[#f8fafc] p-4" key={item}>
                  <div className="h-2 w-16 rounded-md bg-primary/35" />
                  <p className="mt-5 text-sm font-semibold text-foreground">{item}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border">
              {[
                ["Mariana", "Quer agendar avaliacao", "Qualificada"],
                ["Roberto", "Aguardando decisao", "Follow-up"],
                ["Claudia", "Cliente inativa", "Recuperacao"],
              ].map(([name, summary, status]) => (
                <div className="grid grid-cols-[110px_1fr_110px] border-b border-border px-4 py-3 text-sm last:border-0" key={name}>
                  <span className="font-semibold text-foreground">{name}</span>
                  <span className="text-muted">{summary}</span>
                  <span className="font-medium text-primary">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
