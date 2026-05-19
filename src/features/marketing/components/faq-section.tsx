import { faqItems } from "@/features/marketing/data";

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-border bg-surface px-6 py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">FAQ</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Perguntas que todo dono faz antes de colocar IA no atendimento.
          </h2>
        </div>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <details className="rounded-lg border border-border bg-[#fbfcfd] p-5" key={item.question}>
              <summary className="cursor-pointer text-base font-semibold text-foreground">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
