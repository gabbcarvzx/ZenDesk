"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <section className="w-full max-w-lg rounded-lg border border-border bg-surface p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase text-danger">
          Erro inesperado
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Algo saiu do fluxo esperado.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Nao exibimos detalhes tecnicos aqui para proteger dados da operacao. Tente
          novamente ou volte para o painel.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={reset}
            type="button"
          >
            Tentar novamente
          </button>
          <a
            className="rounded-md border border-border px-4 py-2 text-center text-sm font-semibold text-foreground"
            href="/app/dashboard"
          >
            Voltar ao painel
          </a>
        </div>
      </section>
    </main>
  );
}
