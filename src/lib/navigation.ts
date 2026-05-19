import { routes } from "@/lib/routes";

export const publicNavigation = [
  { href: "/#problema", label: "Problema" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#painel", label: "Painel" },
  { href: routes.pricing, label: "Planos" },
  { href: "/#faq", label: "FAQ" },
] as const;

export const dashboardNavigation = [
  { href: routes.dashboard, label: "Dashboard" },
  { href: routes.conversations, label: "Conversas" },
  { href: routes.customers, label: "Clientes" },
  { href: routes.catalog, label: "Produtos/Servicos" },
  { href: routes.appointments, label: "Agenda" },
  { href: routes.payments, label: "Pagamentos" },
  { href: routes.aiPlayground, label: "IA" },
  { href: routes.settings, label: "Configuracoes" },
] as const;
