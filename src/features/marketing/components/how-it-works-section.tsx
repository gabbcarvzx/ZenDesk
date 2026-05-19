import { howItWorks } from "@/features/marketing/data";

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="border-y border-border bg-surface px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-primary">Como funciona</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Do primeiro teste à operação rodando no WhatsApp.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted">
            O fluxo foi pensado para validar a IA antes de abrir o canal real, reduzindo risco para o dono e para o cliente final.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {howItWorks.map((step, index) => (
            <article className="relative rounded-lg border border-border bg-[#fbfcfd] p-6" key={step.title}>
              <p className="text-4xl font-semibold text-[#d97745]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-6 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
