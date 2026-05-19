import { ArrowRight, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export function FinalCtaSection() {
  return (
    <section className="bg-[#0b1f1a] px-6 py-20 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-[#95d5c3]">
              <MessageCircle aria-hidden="true" className="size-5" />
              <p className="text-sm font-semibold uppercase">Teste grátis</p>
            </div>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">
              Pare de perder venda por demora no WhatsApp.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#d7e5df]">
              Crie sua conta, simule conversas no playground e veja como a IA responderia seus clientes antes de conectar o canal real.
            </p>
          </div>
          <ButtonLink
            className="bg-[#f08a4b] text-white hover:bg-[#d97745] lg:min-w-56"
            href={routes.register}
            size="lg"
          >
            Começar agora
            <ArrowRight aria-hidden="true" className="ml-2 size-5" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
