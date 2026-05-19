"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <main
          style={{
            alignItems: "center",
            background: "#f7f8fb",
            color: "#101828",
            display: "flex",
            fontFamily:
              'Geist, "Geist Fallback", ui-sans-serif, system-ui, sans-serif',
            justifyContent: "center",
            minHeight: "100vh",
            padding: "48px 24px",
          }}
        >
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #d9e2df",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(16, 24, 40, 0.08)",
              maxWidth: 520,
              padding: 32,
              width: "100%",
            }}
          >
            <p
              style={{
                color: "#b42318",
                fontSize: 13,
                fontWeight: 700,
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              Erro inesperado
            </p>
            <h1
              style={{
                color: "#101828",
                fontSize: 30,
                lineHeight: 1.2,
                margin: "12px 0 0",
              }}
            >
              A aplicacao encontrou um problema.
            </h1>
            <p
              style={{
                color: "#667085",
                fontSize: 15,
                lineHeight: 1.6,
                margin: "16px 0 0",
              }}
            >
              Os detalhes tecnicos foram ocultados para proteger dados sensiveis.
              Tente novamente em alguns instantes.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#0f6b5f",
                border: 0,
                borderRadius: 6,
                color: "#ffffff",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                marginTop: 24,
                padding: "10px 16px",
              }}
              type="button"
            >
              Tentar novamente
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
