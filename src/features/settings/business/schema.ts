import { z } from "zod";

export const aiToneOptions = [
  { label: "Profissional", value: "profissional" },
  { label: "Amigavel", value: "amigavel" },
  { label: "Vendedor", value: "vendedor" },
  { label: "Informal", value: "informal" },
] as const;

export const languageOptions = [
  { label: "Portugues do Brasil", value: "pt-BR" },
  { label: "Ingles", value: "en-US" },
  { label: "Espanhol", value: "es-ES" },
] as const;

const optionalUrl = z
  .string()
  .trim()
  .max(500, "Use no maximo 500 caracteres.")
  .refine((value) => {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Informe uma URL valida iniciando com http:// ou https://.");

export const businessSettingsSchema = z.object({
  address: z.string().trim().max(300, "Use no maximo 300 caracteres.").default(""),
  businessDescription: z
    .string()
    .trim()
    .min(20, "Descreva o negocio com pelo menos 20 caracteres.")
    .max(2000, "Use no maximo 2000 caracteres."),
  businessHours: z
    .string()
    .trim()
    .min(2, "Informe o horario de funcionamento.")
    .max(500, "Use no maximo 500 caracteres."),
  businessName: z
    .string()
    .trim()
    .min(2, "Informe o nome do negocio.")
    .max(120, "Use no maximo 120 caracteres."),
  cancellationPolicy: z
    .string()
    .trim()
    .max(1500, "Use no maximo 1500 caracteres.")
    .default(""),
  googleMapsUrl: optionalUrl.default(""),
  humanHandoffMessage: z
    .string()
    .trim()
    .min(5, "Informe uma mensagem para transferencia humana.")
    .max(1000, "Use no maximo 1000 caracteres."),
  importantRules: z
    .string()
    .trim()
    .max(2000, "Use no maximo 2000 caracteres.")
    .default(""),
  instagramUrl: optionalUrl.default(""),
  niche: z
    .string()
    .trim()
    .min(2, "Informe o nicho do negocio.")
    .max(120, "Use no maximo 120 caracteres."),
  primaryLanguage: z
    .string()
    .trim()
    .min(2, "Informe o idioma principal.")
    .max(50, "Use no maximo 50 caracteres."),
  toneOfVoice: z.enum(["profissional", "amigavel", "vendedor", "informal"], {
    error: "Selecione um tom de voz valido.",
  }),
  welcomeMessage: z
    .string()
    .trim()
    .min(5, "Informe uma mensagem de boas-vindas.")
    .max(1000, "Use no maximo 1000 caracteres."),
});

export type BusinessSettingsFormValues = z.infer<typeof businessSettingsSchema>;

export type BusinessSettingsFieldErrors = Partial<
  Record<keyof BusinessSettingsFormValues, string[]>
>;

export type BusinessSettingsActionState = {
  fieldErrors?: BusinessSettingsFieldErrors;
  message?: string;
  status: "idle" | "success" | "error";
};

export const emptyBusinessSettings: BusinessSettingsFormValues = {
  address: "",
  businessDescription: "",
  businessHours: "",
  businessName: "",
  cancellationPolicy: "",
  googleMapsUrl: "",
  humanHandoffMessage: "",
  importantRules: "",
  instagramUrl: "",
  niche: "",
  primaryLanguage: "pt-BR",
  toneOfVoice: "profissional",
  welcomeMessage: "",
};

export function getFormString(formData: FormData, key: keyof BusinessSettingsFormValues) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function parseBusinessSettingsForm(formData: FormData) {
  return businessSettingsSchema.safeParse({
    address: getFormString(formData, "address"),
    businessDescription: getFormString(formData, "businessDescription"),
    businessHours: getFormString(formData, "businessHours"),
    businessName: getFormString(formData, "businessName"),
    cancellationPolicy: getFormString(formData, "cancellationPolicy"),
    googleMapsUrl: getFormString(formData, "googleMapsUrl"),
    humanHandoffMessage: getFormString(formData, "humanHandoffMessage"),
    importantRules: getFormString(formData, "importantRules"),
    instagramUrl: getFormString(formData, "instagramUrl"),
    niche: getFormString(formData, "niche"),
    primaryLanguage: getFormString(formData, "primaryLanguage"),
    toneOfVoice: getFormString(formData, "toneOfVoice"),
    welcomeMessage: getFormString(formData, "welcomeMessage"),
  });
}
