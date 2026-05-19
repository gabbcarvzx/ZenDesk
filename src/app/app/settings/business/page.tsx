import type { Metadata } from "next";
import { BusinessSettingsForm } from "@/features/settings/business/components/business-settings-form";
import { getBusinessSettingsPageData } from "@/features/settings/business/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configuracoes do negocio",
};

export default async function BusinessSettingsPage() {
  const { canSubmit, initialSettings, loadError } = await getBusinessSettingsPageData();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface px-5 py-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Configuracoes
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">
          Negocio e comportamento da IA
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Defina contexto comercial, tom de atendimento, regras e mensagens que a IA
          usara para responder clientes. O salvamento acontece na tabela
          business_settings, sempre filtrado pela organizacao autenticada.
        </p>
      </section>

      <BusinessSettingsForm
        canSubmit={canSubmit}
        initialSettings={initialSettings}
        loadError={loadError}
      />
    </div>
  );
}
