"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { routes } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/service-role";
import {
  createOwnerWorkspaceWithSupabase,
  deleteOwnerWorkspaceWithSupabase,
  loginWithPassword,
  registerOwnerAccount,
  type AuthActionState,
} from "@/features/auth/service";

export type { AuthActionState } from "@/features/auth/service";

const loginSchema = z.object({
  email: z.email("Informe um e-mail valido.").trim().toLowerCase(),
  password: z.string().min(1, "Informe sua senha."),
});

const registerSchema = z.object({
  email: z.email("Informe um e-mail valido.").trim().toLowerCase(),
  organization: z.string().trim().min(2, "Informe o nome do negocio.").max(120),
  password: z.string().min(8, "A senha precisa ter no minimo 8 caracteres."),
});

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ActiveProfileRow = {
  id: string;
  organizations: { id: string; status: string } | { id: string; status: string }[] | null;
  status: string;
};

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase nao esta configurado neste ambiente.",
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
  const result = await loginWithPassword(parsed.data, {
    getTenantProfile: () => hasActiveTenantProfile(supabase),
    logError: logAuthError,
    signIn: async (input) => {
      const { error } = await supabase.auth.signInWithPassword(input);

      return {
        error,
        ok: !error,
      };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  });

  if (!result.ok) {
    return {
      message: result.message,
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
  const serviceSupabase = createSupabaseServiceRoleClient();
  const registerInput = {
    email: parsed.data.email,
    organizationName: parsed.data.organization,
    password: parsed.data.password,
  };
  const result = await registerOwnerAccount(registerInput, {
    createAuthUser: async (input) => {
      const { data, error } = await serviceSupabase.auth.admin.createUser({
        email: input.email,
        email_confirm: true,
        password: input.password,
        user_metadata: {
          organizationName: input.organizationName,
          source: "self_service_registration",
        },
      });

      return {
        error,
        userId: data.user?.id ?? null,
      };
    },
    createOwnerWorkspace: (input) =>
      createOwnerWorkspaceWithSupabase(serviceSupabase, input),
    deleteAuthUser: async (userId) => {
      const { error } = await serviceSupabase.auth.admin.deleteUser(userId);

      if (error) {
        throw error;
      }
    },
    deleteOwnerWorkspace: (workspace) =>
      deleteOwnerWorkspaceWithSupabase(serviceSupabase, workspace),
    logError: logAuthError,
    signIn: async (input) => {
      const { error } = await supabase.auth.signInWithPassword(input);

      return {
        error,
        ok: !error,
      };
    },
  });

  if (!result.ok) {
    return {
      message: result.message,
      status: "error",
    };
  }

  redirect(routes.onboarding);
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect(routes.login);
}

async function hasActiveTenantProfile(supabase: SupabaseServerClient) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,status,organizations:organization_id(id,status)")
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  const profile = data as unknown as ActiveProfileRow;
  const organization = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  return profile.status === "active" && organization?.status === "active";
}

function getFormString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function logAuthError(
  event: string,
  data: Record<string, string | number | boolean | null | undefined> = {},
) {
  console.error("[auth]", event, data);
}
