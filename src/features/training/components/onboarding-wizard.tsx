"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Rocket,
  Save,
} from "lucide-react";
import { HelpTip } from "@/components/ui/help-tip";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { saveOnboardingStepAction } from "@/features/training/actions";
import type {
  OnboardingActionState,
  OnboardingFieldErrors,
} from "@/features/training/actions";
import { getOnboardingStep, onboardingSteps } from "@/features/training/data";
import type {
  DeploymentChecklist,
  OnboardingField,
  OnboardingPayload,
  OnboardingProgress,
  OnboardingStepId,
} from "@/features/training/types";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type OnboardingWizardProps = {
  canManage: boolean;
  checklist: DeploymentChecklist;
  initialProgress: OnboardingProgress;
  loadError?: string;
  organizationName: string;
};

export function OnboardingWizard({
  canManage,
  checklist,
  initialProgress,
  loadError,
  organizationName,
}: OnboardingWizardProps) {
  const [activeStepId, setActiveStepId] = useState<OnboardingStepId>(
    initialProgress.currentStep,
  );
  const [state, setState] = useState<OnboardingActionState>({
    progress: initialProgress,
    status: "idle",
  });
  const [isPending, startTransition] = useTransition();
  const progress = state.progress ?? initialProgress;
  const activeStep = getOnboardingStep(activeStepId);
  const completedCount = progress.completedSteps.length;
  const completionPercentage = Math.round((completedCount / onboardingSteps.length) * 100);
  const activeIndex = onboardingSteps.findIndex((step) => step.id === activeStepId);
  const previousStep = onboardingSteps[activeIndex - 1] ?? null;
  const isCompleted = Boolean(progress.completedAt);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  const nextSuggestedStep = useMemo(() => {
    return onboardingSteps.find((step) => !progress.completedSteps.includes(step.id));
  }, [progress.completedSteps]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void saveOnboardingStepAction(state, formData).then((result) => {
        setState(result);

        if (result.status === "success" && result.progress) {
          setActiveStepId(result.progress.currentStep);
        }
      });
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface px-5 py-5 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Onboarding guiado
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Implantacao da {organizationName}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Configure o essencial em etapas curtas. O progresso fica salvo por
              organizacao e pode ser retomado depois.
            </p>
          </div>
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface-muted p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Progresso do onboarding</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              {completedCount} de {onboardingSteps.length} etapas concluídas.
            </p>
          </div>
        </div>
      </section>

      {loadError ? <StatusMessage message={loadError} tone="error" /> : null}
      {state.message ? (
        <StatusMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}
      {!canManage ? (
        <StatusMessage
          message="Seu usuario pode consultar o treinamento, mas apenas owner ou admin salva configuracoes."
          tone="error"
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Etapas</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted">
              {nextSuggestedStep
                ? `Proxima recomendacao: ${nextSuggestedStep.title}.`
                : "Todas as etapas foram revisadas."}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {onboardingSteps.map((step) => {
              const done = progress.completedSteps.includes(step.id);
              const active = activeStepId === step.id;

              return (
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition",
                    active
                      ? "border-primary bg-[#e5f2ee] text-foreground"
                      : "border-border bg-surface hover:bg-surface-muted",
                  )}
                  key={step.id}
                  onClick={() => setActiveStepId(step.id)}
                  type="button"
                >
                  <span
                    className={cn(
                      "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                      done ? "bg-[#ecfdf3] text-[#067647]" : "bg-surface-muted text-muted",
                    )}
                  >
                    {done ? <CheckCircle2 aria-hidden="true" className="size-4" /> : step.number}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{step.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      Etapa {step.number} de {onboardingSteps.length}
                    </span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <form key={activeStep.id} className="space-y-6" onSubmit={handleSubmit}>
          <input name="stepId" type="hidden" value={activeStep.id} />
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                    Etapa {activeStep.number}
                  </p>
                  <CardTitle className="mt-2">{activeStep.title}</CardTitle>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                    {activeStep.description}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm leading-6 text-muted lg:max-w-xs">
                  <span className="font-semibold text-foreground">Impacto no negocio: </span>
                  {activeStep.businessImpact}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {activeStep.fields.length ? (
                <div className="grid gap-5">
                  {activeStep.fields.map((field) => (
                    <OnboardingInput
                      disabled={!canManage || isPending}
                      error={fieldError(fieldErrors, field.name)}
                      field={field}
                      key={field.name}
                      value={progress.payload[field.name]}
                    />
                  ))}
                </div>
              ) : (
                <StepIntro
                  completed={isCompleted}
                  stepId={activeStep.id}
                  checklistPercentage={checklist.percentage}
                />
              )}
            </CardContent>
          </Card>

          <div className="sticky bottom-0 -mx-4 border-t border-border bg-[#f4f6f8]/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
            <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {previousStep ? (
                  <Button
                    disabled={isPending}
                    onClick={() => setActiveStepId(previousStep.id)}
                    type="button"
                    variant="outline"
                  >
                    <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                    Voltar
                  </Button>
                ) : null}
                <ButtonLink href={routes.training} variant="ghost">
                  Continuar depois
                </ButtonLink>
              </div>
              <Button disabled={!canManage || isPending} type="submit">
                {isPending ? (
                  <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
                ) : activeStep.id === "finish" ? (
                  <Rocket aria-hidden="true" className="mr-2 size-4" />
                ) : (
                  <Save aria-hidden="true" className="mr-2 size-4" />
                )}
                {isPending ? "Salvando..." : activeStep.nextLabel}
                {!isPending && activeStep.id !== "finish" ? (
                  <ArrowRight aria-hidden="true" className="ml-2 size-4" />
                ) : null}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function OnboardingInput({
  disabled,
  error,
  field,
  value,
}: {
  disabled: boolean;
  error?: string;
  field: OnboardingField;
  value: OnboardingPayload[keyof OnboardingPayload];
}) {
  const stringValue = typeof value === "string" ? value : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={field.name}>{field.label}</Label>
        <HelpTip>{field.help}</HelpTip>
      </div>
      {field.type === "textarea" ? (
        <Textarea
          defaultValue={stringValue}
          disabled={disabled}
          id={field.name}
          name={field.name}
          placeholder={field.placeholder}
          required={field.required}
          rows={5}
        />
      ) : field.type === "select" ? (
        <Select
          defaultValue={stringValue || field.options?.[0]?.value}
          disabled={disabled}
          id={field.name}
          name={field.name}
          required={field.required}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          defaultValue={stringValue}
          disabled={disabled}
          id={field.name}
          name={field.name}
          placeholder={field.placeholder}
          required={field.required}
        />
      )}
      <p className="text-xs leading-5 text-muted">Exemplo: {field.example}</p>
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </div>
  );
}

function StepIntro({
  checklistPercentage,
  completed,
  stepId,
}: {
  checklistPercentage: number;
  completed: boolean;
  stepId: OnboardingStepId;
}) {
  if (stepId === "finish") {
    return (
      <div className="rounded-lg border border-border bg-surface-muted p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">
              Checklist atual: {checklistPercentage}% pronto
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Concluir o onboarding marca a implantacao guiada como finalizada, mas o
              checklist continua mostrando pendencias reais antes do go-live.
            </p>
            {completed ? (
              <p className="mt-3 text-sm font-semibold text-primary">
                Onboarding ja concluido. Voce pode revisar qualquer etapa quando precisar.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface-muted p-5">
      <div className="flex items-start gap-3">
        <Rocket aria-hidden="true" className="mt-0.5 size-5 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">Vamos configurar com calma.</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            O processo salva cada etapa no servidor e permite voltar depois sem perder
            progresso.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "error";
}) {
  return (
    <div
      className={
        tone === "success"
          ? "rounded-lg border border-[#abefc6] bg-[#ecfdf3] px-4 py-3 text-sm font-medium text-[#067647]"
          : "rounded-lg border border-[#ffd8d3] bg-[#fff1f0] px-4 py-3 text-sm font-medium text-danger"
      }
    >
      {message}
    </div>
  );
}

function fieldError(
  errors: OnboardingFieldErrors | undefined,
  field: keyof OnboardingPayload,
) {
  return errors?.[field]?.[0];
}
