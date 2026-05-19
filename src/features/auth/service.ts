import { randomUUID } from "crypto";
import type { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role";

type SupabaseServiceRoleClient = ReturnType<typeof createSupabaseServiceRoleClient>;

export type AuthProviderError = {
  code?: string | number;
  message?: string;
  name?: string;
  status?: string | number;
};

export type AuthMutationResult = {
  error?: AuthProviderError | null;
  ok: boolean;
};

export type AuthUserCreationResult = {
  error?: AuthProviderError | null;
  userId?: string | null;
};

export type OwnerWorkspace = {
  businessSettingsId: string;
  organizationId: string;
  profileId: string;
};

export type RegisterOwnerInput = {
  email: string;
  organizationName: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthServiceResult =
  | {
      ok: true;
      organizationId?: string;
      userId?: string;
    }
  | {
      message: string;
      ok: false;
      reason:
        | "auth_user_create_failed"
        | "login_failed"
        | "missing_tenant_profile"
        | "session_create_failed"
        | "workspace_create_failed";
    };

export type AuthActionState = {
  message: string | null;
  status: "idle" | "success" | "error";
};

export type AuthServiceLogger = (
  event: string,
  data?: Record<string, string | number | boolean | null | undefined>,
) => void;

export type RegisterOwnerDependencies = {
  createAuthUser: (input: RegisterOwnerInput) => Promise<AuthUserCreationResult>;
  createOwnerWorkspace: (
    input: RegisterOwnerInput & { userId: string },
  ) => Promise<OwnerWorkspace>;
  deleteAuthUser: (userId: string) => Promise<void>;
  deleteOwnerWorkspace: (workspace: OwnerWorkspace) => Promise<void>;
  logError?: AuthServiceLogger;
  signIn: (input: LoginInput) => Promise<AuthMutationResult>;
};

export type LoginDependencies = {
  getTenantProfile: () => Promise<boolean>;
  logError?: AuthServiceLogger;
  signIn: (input: LoginInput) => Promise<AuthMutationResult>;
  signOut: () => Promise<void>;
};

type OrganizationInsertRow = {
  id: string;
};

type ProfileInsertRow = {
  id: string;
};

type BusinessSettingsInsertRow = {
  id: string;
};

export async function registerOwnerAccount(
  input: RegisterOwnerInput,
  dependencies: RegisterOwnerDependencies,
): Promise<AuthServiceResult> {
  const authUser = await dependencies.createAuthUser(input);

  if (authUser.error || !authUser.userId) {
    dependencies.logError?.("register_auth_user_failed", toSafeErrorLog(authUser.error));

    return {
      message: getRegistrationErrorMessage(authUser.error),
      ok: false,
      reason: "auth_user_create_failed",
    };
  }

  let workspace: OwnerWorkspace | null = null;

  try {
    workspace = await dependencies.createOwnerWorkspace({
      ...input,
      userId: authUser.userId,
    });
  } catch (error) {
    dependencies.logError?.("register_workspace_failed", toSafeUnknownErrorLog(error));
    await safeCleanup({
      dependencies,
      userId: authUser.userId,
      workspace,
    });

    return {
      message:
        "Nao foi possivel preparar sua organizacao. Tente novamente em instantes ou fale com o suporte.",
      ok: false,
      reason: "workspace_create_failed",
    };
  }

  const session = await dependencies.signIn({
    email: input.email,
    password: input.password,
  });

  if (!session.ok) {
    dependencies.logError?.("register_session_failed", toSafeErrorLog(session.error));
    await safeCleanup({
      dependencies,
      userId: authUser.userId,
      workspace,
    });

    return {
      message:
        "Conta criada, mas nao foi possivel iniciar a sessao. Tente criar a conta novamente.",
      ok: false,
      reason: "session_create_failed",
    };
  }

  return {
    ok: true,
    organizationId: workspace.organizationId,
    userId: authUser.userId,
  };
}

export async function loginWithPassword(
  input: LoginInput,
  dependencies: LoginDependencies,
): Promise<AuthServiceResult> {
  const session = await dependencies.signIn(input);

  if (!session.ok) {
    dependencies.logError?.("login_failed", toSafeErrorLog(session.error));

    return {
      message: getLoginErrorMessage(session.error),
      ok: false,
      reason: "login_failed",
    };
  }

  const hasTenantProfile = await dependencies.getTenantProfile();

  if (!hasTenantProfile) {
    await dependencies.signOut();
    dependencies.logError?.("login_missing_tenant_profile");

    return {
      message:
        "Sua conta existe, mas nao esta vinculada a uma organizacao ativa. Fale com o suporte.",
      ok: false,
      reason: "missing_tenant_profile",
    };
  }

  return {
    ok: true,
  };
}

export async function createOwnerWorkspaceWithSupabase(
  supabase: SupabaseServiceRoleClient,
  input: RegisterOwnerInput & { userId: string },
): Promise<OwnerWorkspace> {
  let organizationId: string | null = null;

  try {
    const organizationSlug = `${slugify(input.organizationName)}-${randomUUID().slice(0, 8)}`;
    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .insert({
        name: input.organizationName,
        owner_user_id: input.userId,
        plan_slug: "starter",
        slug: organizationSlug,
        status: "active",
      })
      .select("id")
      .single();

    if (organizationError || !organization) {
      throw organizationError ?? new Error("Organization was not created.");
    }

    organizationId = (organization as OrganizationInsertRow).id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        full_name: getNameFromEmail(input.email),
        organization_id: organizationId,
        role: "owner",
        status: "active",
        user_id: input.userId,
      })
      .select("id")
      .single();

    if (profileError || !profile) {
      throw profileError ?? new Error("Profile was not created.");
    }

    const { data: settings, error: settingsError } = await supabase
      .from("business_settings")
      .insert({
        ai_enabled: false,
        business_name: input.organizationName,
        default_language: "pt-BR",
        organization_id: organizationId,
        tone_of_voice: "profissional",
      })
      .select("id")
      .single();

    if (settingsError || !settings) {
      throw settingsError ?? new Error("Business settings were not created.");
    }

    return {
      businessSettingsId: (settings as BusinessSettingsInsertRow).id,
      organizationId,
      profileId: (profile as ProfileInsertRow).id,
    };
  } catch (error) {
    if (organizationId) {
      await deleteOwnerWorkspaceWithSupabase(supabase, {
        organizationId,
      });
    }

    throw error;
  }
}

export async function deleteOwnerWorkspaceWithSupabase(
  supabase: SupabaseServiceRoleClient,
  workspace: Pick<OwnerWorkspace, "organizationId">,
) {
  const organizationId = workspace.organizationId;
  const deletions = [
    await supabase.from("business_settings").delete().eq("organization_id", organizationId),
    await supabase.from("profiles").delete().eq("organization_id", organizationId),
    await supabase.from("organizations").delete().eq("id", organizationId),
  ];
  const failedDeletion = deletions.find((result) => result.error);

  if (failedDeletion?.error) {
    throw failedDeletion.error;
  }
}

export function getRegistrationErrorMessage(error: AuthProviderError | null | undefined) {
  const message = normalizeErrorText(error);

  if (/already|registered|exists|duplicate/i.test(message)) {
    return "Ja existe uma conta com este e-mail. Tente entrar ou use outro e-mail.";
  }

  if (/rate limit|too many|over_email_send_rate_limit/i.test(message)) {
    return "O provedor de autenticacao limitou tentativas temporariamente. Aguarde alguns minutos e tente novamente.";
  }

  if (/password/i.test(message)) {
    return "A senha nao atende aos requisitos de seguranca.";
  }

  return "Nao foi possivel criar a conta. Verifique os dados e tente novamente.";
}

export function getLoginErrorMessage(error: AuthProviderError | null | undefined) {
  const message = normalizeErrorText(error);

  if (/invalid|credentials|login/i.test(message)) {
    return "E-mail ou senha invalidos.";
  }

  if (/email.*confirm|confirmed/i.test(message)) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (/rate limit|too many/i.test(message)) {
    return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";
  }

  return "Nao foi possivel entrar agora. Tente novamente em instantes.";
}

function normalizeErrorText(error: AuthProviderError | null | undefined) {
  return [error?.name, error?.code, error?.status, error?.message]
    .filter((value) => value !== null && value !== undefined)
    .join(" ");
}

function toSafeErrorLog(error: AuthProviderError | null | undefined) {
  return {
    errorCode: error?.code ? String(error.code).slice(0, 80) : undefined,
    errorName: error?.name ? error.name.slice(0, 80) : undefined,
    errorStatus: error?.status ? String(error.status).slice(0, 80) : undefined,
  };
}

function toSafeUnknownErrorLog(error: unknown) {
  return {
    errorName: error instanceof Error ? error.name : "UnknownError",
  };
}

async function safeCleanup({
  dependencies,
  userId,
  workspace,
}: {
  dependencies: Pick<
    RegisterOwnerDependencies,
    "deleteAuthUser" | "deleteOwnerWorkspace" | "logError"
  >;
  userId: string;
  workspace: OwnerWorkspace | null;
}) {
  try {
    if (workspace) {
      await dependencies.deleteOwnerWorkspace(workspace);
    }
  } catch (error) {
    dependencies.logError?.("register_workspace_cleanup_failed", toSafeUnknownErrorLog(error));
  }

  try {
    await dependencies.deleteAuthUser(userId);
  } catch (error) {
    dependencies.logError?.("register_auth_user_cleanup_failed", toSafeUnknownErrorLog(error));
  }
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
