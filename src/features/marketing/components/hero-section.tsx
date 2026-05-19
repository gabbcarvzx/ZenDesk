import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { proofMetrics } from "@/features/marketing/data";
import { routes } from "@/lib/routes";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0b1f1a] text-white">
      <HeroProductScene />
      <div className="absolute inset-0 bg-[#081411]/75" />
      <div className="relative mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-7xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase text-[#95d5c3]">
            IA comercial para WhatsApp
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
            Transforme seu WhatsApp em um vendedor com IA que atende, agenda e vende 24 horas por dia.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d7e5df]">
            Centralize conversas, clientes, agenda, cobranças e respostas inteligentes em um painel feito para pequenos negócios venderem mais sem aumentar a equipe.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              className="bg-[#f08a4b] text-white hover:bg-[#d97745]"
              href={routes.register}
              size="lg"
            >
              Começar teste grátis
              <ArrowRight aria-hidden="true" className="ml-2 size-5" />
            </ButtonLink>
            <ButtonLink
              className="border-white/30 bg-white/10 text-white hover:bg-white/15"
              href="#planos"
              size="lg"
              variant="outline"
            >
              Ver planos
            </ButtonLink>
          </div>
          <ul className="mt-8 grid max-w-3xl gap-3 text-sm text-[#d7e5df] sm:grid-cols-3">
            {[
              "Não inventa preço ou horário",
              "Pede humano quando precisa",
              "Avança para venda ou agenda",
            ].map((item) => (
              <li className="flex items-center gap-2" key={item}>
                <CheckCircle2 aria-hidden="true" className="size-4 text-[#95d5c3]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-12 grid gap-4 border-t border-white/15 pt-6 sm:grid-cols-3">
          {proofMetrics.map((metric) => (
            <div key={metric.label}>
              <p className="text-3xl font-semibold text-white">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-[#b8ccc4]">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroProductScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0 opacity-80">
      <div className="absolute left-[42%] top-10 hidden w-[760px] rotate-[-2deg] rounded-lg border border-white/15 bg-[#f7f8fb] p-4 shadow-2xl lg:block">
        <div className="grid min-h-[460px] grid-cols-[180px_1fr_240px] gap-4">
          <aside className="rounded-lg bg-[#102c26] p-4 text-white">
            <div className="h-8 w-24 rounded-md bg-white/20" />
            <div className="mt-8 space-y-3 text-xs">
              {["Conversas", "Clientes", "Agenda", "Pagamentos", "IA"].map((item) => (
                <div className="rounded-md bg-white/10 px-3 py-2" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                ["42", "conversas abertas"],
                ["18", "leads quentes"],
                ["9", "agendamentos"],
              ].map(([value, label]) => (
                <div className="rounded-lg border border-[#d9e2df] bg-white p-4" key={label}>
                  <p className="text-2xl font-semibold text-[#102c26]">{value}</p>
                  <p className="mt-1 text-xs text-[#667085]">{label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-[#d9e2df] bg-white">
              {[
                ["Mariana", "Quer horário para sábado", "Agendar"],
                ["Rafael", "Perguntou preço do pacote", "Vender"],
                ["Cláudia", "Pediu Pix para reservar", "Cobrar"],
                ["Bruno", "Dúvida fora da base", "Humano"],
              ].map(([name, summary, action]) => (
                <div className="grid grid-cols-[88px_1fr_76px] gap-3 border-b border-[#edf2f0] px-4 py-3 text-xs last:border-0" key={name}>
                  <span className="font-semibold text-[#101828]">{name}</span>
                  <span className="text-[#667085]">{summary}</span>
                  <span className="font-semibold text-[#0f6b5f]">{action}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#d9e2df] bg-white p-4">
            <div className="flex items-center gap-2 border-b border-[#edf2f0] pb-3">
              <MessageCircle className="size-4 text-[#0f6b5f]" />
              <p className="text-sm font-semibold text-[#101828]">WhatsApp</p>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <ChatBubble text="Oi, vocês atendem hoje?" />
              <ChatBubble align="right" text="Atendemos até 19h. Quer que eu veja um horário?" />
              <ChatBubble text="Pode ser 16h." />
              <ChatBubble align="right" text="Perfeito. Posso confirmar com seu nome e telefone?" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-[#0f6b5f]">
              {[Bot, CalendarCheck, CreditCard].map((Icon, index) => (
                <div className="grid h-12 place-items-center rounded-md bg-[#e5f2ee]" key={index}>
                  <Icon className="size-5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-10 right-6 w-72 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur md:right-14 lg:hidden">
        <div className="flex items-center gap-3 text-white">
          <Bot className="size-5 text-[#95d5c3]" />
          <p className="text-sm font-semibold">IA respondendo agora</p>
        </div>
        <div className="mt-4 space-y-2 text-xs text-[#d7e5df]">
          <p>Cliente: Quero agendar amanhã.</p>
          <p>IA: Tenho horários disponíveis. Posso confirmar seu nome?</p>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
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
            ? "max-w-[170px] rounded-lg bg-[#0f6b5f] px-3 py-2 text-white"
            : "max-w-[170px] rounded-lg bg-[#eef4f1] px-3 py-2 text-[#344054]"
        }
      >
        {text}
      </p>
    </div>
  );
}
