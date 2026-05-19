import { AlertCircle, CheckCircle2 } from "lucide-react";
import { problemPoints, solutionPoints } from "@/features/marketing/data";

export function ProblemSolutionSection() {
  return (
    <section id="problema" className="border-b border-border bg-surface px-6 py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">O problema</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            O WhatsApp vende muito, mas também deixa muito dinheiro escapar.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted">
            Pequenos negócios dependem do WhatsApp para quase tudo: orçamento, dúvida, agenda, cobrança e pós-venda. Quando a resposta atrasa, o cliente vai para o concorrente.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-[#f2d5c6] bg-[#fff8f3] p-5">
            <div className="flex items-center gap-3">
              <AlertCircle aria-hidden="true" className="size-5 text-[#c65421]" />
              <h3 className="text-lg font-semibold text-foreground">Hoje</h3>
            </div>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-[#60483d]">
              {problemPoints.map((item) => (
                <li className="flex gap-3" key={item}>
                  <span className="mt-2 size-1.5 rounded-full bg-[#c65421]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-[#cfe4dc] bg-[#f1faf6] p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 aria-hidden="true" className="size-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Com a Central IA</h3>
            </div>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-[#315249]">
              {solutionPoints.map((item) => (
                <li className="flex gap-3" key={item}>
                  <CheckCircle2 aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
