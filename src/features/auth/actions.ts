"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { routes } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/service-role";

export type AuthActionState = {
  message: string | null;
  status: "idle" | "success" | "error";
};

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  password: z.string().min(1, "Informe sua senha."),
});

const registerSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  organization: z.string().trim().min(2, "Informe o nome do negócio.").max(120),
  password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
});

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase não está configurado neste ambiente.",
      status: "error",
    };
  }

  const parsed = loginSchema.safeParse({
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revise os dados de acesso.",
      status: "error",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      message: "Não foi possível entrar. Verifique e-mail e senha.",
      status: "error",
    };
  }

  redirect(routes.dashboard);
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return {
      message:
        "Cadastro requer Supabase e service role configurados no servidor.",
      status: "error",
    };
  }

  const parsed = registerSchema.safeParse({
    email: getFormString(formData, "email"),
    organization: getFormString(formData, "organization"),
    password: getFormString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revise os dados do cadastro.",
      status: "error",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      message: "Não foi possível criar a conta. Verifique os dados e tente novamente.",
      status: "error",
    };
  }

  try {
    await ensureOwnerOrganization({
      email: parsed.data.email,
      organizationName: parsed.data.organization,
      userId: data.user.id,
    });
  } catch {
    return {
      message:
        "Conta criada, mas não foi possível preparar a organização. Fale com o suporte antes de continuar.",
      status: "error",
    };
  }

  if (!data.session) {
    return {
      message:
        "Conta criada. Confirme seu e-mail e depois entre usando suas credenciais.",
      status: "success",
    };
  }

  redirect(routes.dashboard);
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect(routes.login);
}

async function ensureOwnerOrganization({
  email,
  organizationName,
  userId,
}: {
  email: string;
  organizationName: string;
  userId: string;
}) {
  const serviceSupabase = createSupabaseServiceRoleClient();
  const { data: existingProfile, error: profileError } = await serviceSupabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (existingProfile) {
    return;
  }

  const organizationSlug = `${slugify(organizationName)}-${randomUUID().slice(0, 8)}`;
  const { data: organization, error: organizationError } = await serviceSupabase
    .from("organizations")
    .insert({
      name: organizationName,
      owner_user_id: userId,
      plan_slug: "starter",
      slug: organizationSlug,
      status: "active",
    })
    .select("id")
    .single();

  if (organizationError) {
    throw organizationError;
  }

  const organizationId = (organization as { id: string }).id;
  const { error: profileInsertError } = await serviceSupabase.from("profiles").insert({
    full_name: getNameFromEmail(email),
    organization_id: organizationId,
    role: "owner",
    status: "active",
    user_id: userId,
  });

  if (profileInsertError) {
    throw profileInsertError;
  }

  const { error: settingsError } = await serviceSupabase
    .from("business_settings")
    .insert({
      ai_enabled: false,
      business_name: organizationName,
      default_language: "pt-BR",
      organization_id: organizationId,
      tone_of_voice: "profissional",
    });

  if (settingsError) {
    throw settingsError;
  }
}

function getFormString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return slug || "organizacao";
}

function getNameFromEmail(email: string) {
  return email.split("@")[0] || "Dono";
}
