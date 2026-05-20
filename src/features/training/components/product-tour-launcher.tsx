"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, PlayCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routeTourSteps } from "@/features/training/data";
import type { TourArea, TourStep } from "@/features/training/types";

type HighlightRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export function ProductTourLauncher() {
  const pathname = usePathname();
  const area = getTourArea(pathname);
  const steps = area ? routeTourSteps[area] : [];

  if (!area || steps.length === 0) {
    return null;
  }

  return <ProductTourState area={area} key={area} steps={steps} />;
}

function ProductTourState({
  area,
  steps,
}: {
  area: TourArea;
  steps: readonly TourStep[];
}) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const normalizedStepIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const currentStep = steps[normalizedStepIndex];
  const storageKey = area ? `product-tour-last-opened:${area}` : null;

  useEffect(() => {
    if (!open || !currentStep) {
      return;
    }

    let frame = 0;

    function updateRect() {
      const target = document.querySelector<HTMLElement>(
        `[data-tour-id="${currentStep.targetId}"]`,
      );

      if (!target) {
        setRect(null);
        return;
      }

      const nextRect = target.getBoundingClientRect();
      setRect({
        height: nextRect.height,
        left: nextRect.left,
        top: nextRect.top,
        width: nextRect.width,
      });
    }

    frame = window.requestAnimationFrame(updateRect);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [currentStep, open]);

  const title = useMemo(() => getTourAreaTitle(area), [area]);

  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={() => {
          setStepIndex(0);
          setOpen(true);
          if (storageKey) {
            window.localStorage.setItem(storageKey, new Date().toISOString());
          }
        }}
        type="button"
      >
        <PlayCircle aria-hidden="true" className="size-4" />
        Tour
      </button>

      {open && currentStep ? (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-[#101828]/35" />
          {rect ? (
            <div
              className="absolute rounded-lg border-2 border-primary bg-white/10 shadow-[0_0_0_9999px_rgba(16,24,40,0.35)]"
              style={{
                height: rect.height + 12,
                left: rect.left - 6,
                top: rect.top - 6,
                width: rect.width + 12,
              }}
            />
          ) : null}
          <div className="pointer-events-auto absolute bottom-5 right-5 w-[min(420px,calc(100vw-2.5rem))] rounded-lg border border-border bg-surface p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  {title}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  {currentStep.title}
                </h3>
              </div>
              <button
                aria-label="Fechar tour"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-surface-muted hover:text-foreground"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{currentStep.body}</p>
            <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <span className="text-sm font-medium text-muted">
                {normalizedStepIndex + 1} de {steps.length}
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronLeft aria-hidden="true" className="mr-1 size-4" />
                  Voltar
                </Button>
                {normalizedStepIndex === steps.length - 1 ? (
                  <Button onClick={() => setOpen(false)} size="sm" type="button">
                    Concluir
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      setStepIndex((index) => Math.min(steps.length - 1, index + 1))
                    }
                    size="sm"
                    type="button"
                  >
                    Avancar
                    <ChevronRight aria-hidden="true" className="ml-1 size-4" />
                  </Button>
                )}
              </div>
            </div>
            <button
              className="mt-3 text-sm font-semibold text-muted transition hover:text-foreground"
              onClick={() => setOpen(false)}
              type="button"
            >
              Pular tutorial
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getTourArea(pathname: string): TourArea | null {
  if (pathname.startsWith("/app/conversations")) {
    return "conversations";
  }

  if (pathname.startsWith("/app/ai")) {
    return "ai";
  }

  if (pathname.startsWith("/app/customers")) {
    return "customers";
  }

  if (pathname.startsWith("/app/payments")) {
    return "payments";
  }

  if (pathname.startsWith("/app/settings")) {
    return "settings";
  }

  if (pathname.startsWith("/app/dashboard")) {
    return "dashboard";
  }

  return null;
}

function getTourAreaTitle(area: TourArea | null) {
  const labels: Record<TourArea, string> = {
    ai: "Tour da IA",
    conversations: "Tour de conversas",
    customers: "Tour de clientes",
    dashboard: "Tour do dashboard",
    payments: "Tour de pagamentos",
    settings: "Tour de configuracoes",
  };

  return area ? labels[area] : "Tour";
}
