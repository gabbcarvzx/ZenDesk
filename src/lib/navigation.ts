import { routes } from "@/lib/routes";

export const publicNavigation = [
  { href: routes.home, label: "Home" },
  { href: routes.pricing, label: "Precos" },
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
