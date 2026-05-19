"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpTip } from "@/components/ui/help-tip";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { saveBusinessSettingsAction } from "@/features/settings/business/actions";
import {
  aiToneOptions,
  languageOptions,
  type BusinessSettingsActionState,
  type BusinessSettingsFieldErrors,
  type BusinessSettingsFormValues,
} from "@/features/settings/business/schema";

type BusinessSettingsFormProps = {
  canSubmit: boolean;
  initialSettings: BusinessSettingsFormValues;
  loadError?: string;
};

const initialActionState: BusinessSettingsActionState = {
  status: "idle",
};

export function BusinessSettingsForm({
  canSubmit,
  initialSettings,
  loadError,
}: BusinessSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveBusinessSettingsAction,
    initialActionState,
  );
  const isDisabled = !canSubmit || isPending;

  return (
    <form action={formAction} className="space-y-6">
      {loadError ? (
        <StatusMessage
          message={loadError}
          tone="error"
        />
      ) : null}

      {state.message ? (
        <StatusMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Informacoes do negocio</CardTitle>
          <CardDescription>
            Esses dados formam o contexto base para respostas da IA e futuros fluxos de
            atendimento no WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "businessName")}
            help="Use o nome que seus clientes reconhecem no WhatsApp e em cobrancas."
            label="Nome do negocio"
            name="businessName"
            placeholder="Clinica Exemplo"
            required
            type="input"
            value={initialSettings.businessName}
          />
          <Field
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "niche")}
            help="O nicho ajuda a IA a adaptar linguagem, exemplos e proximos passos."
            label="Nicho"
            name="niche"
            placeholder="Estetica, saude, educacao, servicos locais..."
            required
            type="input"
            value={initialSettings.niche}
          />
          <Field
            className="md:col-span-2"
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "businessDescription")}
            help="Explique o que vende, para quem atende e quais diferenciais a IA deve lembrar."
            label="Descricao do negocio"
            name="businessDescription"
            placeholder="Explique o que o negocio vende, para quem atende e quais diferenciais devem aparecer nas respostas."
            required
            type="textarea"
            value={initialSettings.businessDescription}
          />
          <Field
            className="md:col-span-2"
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "address")}
            help="Endereco pode ser usado pela IA para orientar clientes sobre localizacao."
            label="Endereco"
            name="address"
            placeholder="Rua, numero, bairro, cidade"
            type="input"
            value={initialSettings.address}
          />
          <Field
            className="md:col-span-2"
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "businessHours")}
            help="Inclua dias, horarios especiais e excecoes para evitar promessas erradas."
            label="Horario de funcionamento"
            name="businessHours"
            placeholder="Segunda a sexta, 08:00 as 18:00. Sabado, 08:00 as 12:00."
            required
            type="textarea"
            value={initialSettings.businessHours}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comportamento da IA</CardTitle>
          <CardDescription>
            Configure tom, idioma, regras e mensagens que orientam o atendimento
            automatizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="toneOfVoice">Tom de voz da IA</Label>
              <HelpTip>
                Define como a IA conversa com seus clientes. Exemplo: profissional,
                amigavel ou vendedor.
              </HelpTip>
            </div>
            <Select
              defaultValue={initialSettings.toneOfVoice}
              disabled={isDisabled}
              id="toneOfVoice"
              name="toneOfVoice"
              required
            >
              {aiToneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError error={fieldError(state.fieldErrors, "toneOfVoice")} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="primaryLanguage">Idioma principal</Label>
              <HelpTip>
                Idioma usado pela IA quando o cliente nao indicar outro idioma na conversa.
              </HelpTip>
            </div>
            <Select
              defaultValue={initialSettings.primaryLanguage}
              disabled={isDisabled}
              id="primaryLanguage"
              name="primaryLanguage"
              required
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError error={fieldError(state.fieldErrors, "primaryLanguage")} />
          </div>

          <Field
            className="md:col-span-2"
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "importantRules")}
            help="Regras reduzem respostas arriscadas. Ex.: nunca prometer desconto sem aprovacao."
            label="Regras importantes"
            name="importantRules"
            placeholder="Ex.: nunca prometer desconto sem aprovacao, sempre confirmar disponibilidade, nao dar orientacao medica..."
            type="textarea"
            value={initialSettings.importantRules}
          />
          <Field
            className="md:col-span-2"
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "welcomeMessage")}
            help="Mensagem inicial curta para o cliente entender que esta sendo atendido."
            label="Mensagem de boas-vindas"
            name="welcomeMessage"
            placeholder="Ola! Sou a assistente virtual da empresa. Como posso ajudar?"
            required
            type="textarea"
            value={initialSettings.welcomeMessage}
          />
          <Field
            className="md:col-span-2"
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "humanHandoffMessage")}
            help="Texto usado quando uma pessoa da equipe precisa assumir o atendimento."
            label="Mensagem quando humano precisa assumir"
            name="humanHandoffMessage"
            placeholder="Vou chamar uma pessoa da nossa equipe para continuar seu atendimento."
            required
            type="textarea"
            value={initialSettings.humanHandoffMessage}
          />
          <Field
            className="md:col-span-2"
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "cancellationPolicy")}
            help="Politicas claras evitam conflito sobre prazos, remarcacoes e reembolsos."
            label="Politica de cancelamento"
            name="cancellationPolicy"
            placeholder="Explique prazos, remarcacoes, multas ou regras comerciais importantes."
            type="textarea"
            value={initialSettings.cancellationPolicy}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Canais e localizacao</CardTitle>
          <CardDescription>
            Links usados pela IA para direcionar clientes para redes sociais e localizacao.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "instagramUrl")}
            help="Link que a IA pode usar para direcionar clientes ao perfil oficial."
            label="Link do Instagram"
            name="instagramUrl"
            placeholder="https://instagram.com/suaempresa"
            type="input"
            value={initialSettings.instagramUrl}
          />
          <Field
            disabled={isDisabled}
            error={fieldError(state.fieldErrors, "googleMapsUrl")}
            help="Link usado para orientar clientes sobre rota, endereco e ponto de referencia."
            label="Link do Google Maps"
            name="googleMapsUrl"
            placeholder="https://maps.google.com/..."
            type="input"
            value={initialSettings.googleMapsUrl}
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-[#f4f6f8]/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-muted">
            As configuracoes serao salvas por organizacao e respeitam RLS no Supabase.
          </p>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "Salvando..." : "Salvar configuracoes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

type FieldProps = {
  className?: string;
  disabled: boolean;
  error?: string;
  help?: string;
  label: string;
  name: keyof BusinessSettingsFormValues;
  placeholder?: string;
  required?: boolean;
  type: "input" | "textarea";
  value: string;
};

function Field({
  className,
  disabled,
  error,
  help,
  label,
  name,
  placeholder,
  required,
  type,
  value,
}: FieldProps) {
  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={name}>{label}</Label>
          {help ? <HelpTip>{help}</HelpTip> : null}
        </div>
        {type === "textarea" ? (
          <Textarea
            defaultValue={value}
            disabled={disabled}
            id={name}
            name={name}
            placeholder={placeholder}
            required={required}
          />
        ) : (
          <Input
            defaultValue={value}
            disabled={disabled}
            id={name}
            name={name}
            placeholder={placeholder}
            required={required}
          />
        )}
        <FieldError error={error} />
      </div>
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) {
    return null;
  }

  return <p className="text-sm font-medium text-danger">{error}</p>;
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
  errors: BusinessSettingsFieldErrors | undefined,
  field: keyof BusinessSettingsFormValues,
) {
  return errors?.[field]?.[0];
}
