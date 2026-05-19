import { BriefcaseBusiness } from "lucide-react";
import { niches } from "@/features/marketing/data";

export function NichesSection() {
  return (
    <section id="nichos" className="bg-[#102c26] px-6 py-20 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-[#95d5c3]">Nichos atendidos</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
              Feito para negócios locais que vivem de resposta rápida.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#d7e5df]">
              Se o cliente chama no WhatsApp para tirar dúvida, pedir preço, reservar horário ou fechar serviço, a IA pode virar uma camada comercial permanente.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {niches.map((niche) => (
              <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 p-4" key={niche}>
                <BriefcaseBusiness aria-hidden="true" className="size-5 text-[#f08a4b]" />
                <span className="text-sm font-semibold">{niche}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
