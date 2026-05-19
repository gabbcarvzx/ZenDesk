import { describe, expect, it, vi } from "vitest";
import {
  loginWithPassword,
  registerOwnerAccount,
  type OwnerWorkspace,
  type RegisterOwnerDependencies,
} from "./service";

const validInput = {
  email: "owner@example.com",
  organizationName: "Clinica Exemplo",
  password: "strong-password",
};

const loginInput = {
  email: validInput.email,
  password: validInput.password,
};

const workspace: OwnerWorkspace = {
  businessSettingsId: "settings_1",
  organizationId: "org_1",
  profileId: "profile_1",
};

describe("auth service", () => {
  it("creates auth user, organization workspace and session on registration", async () => {
    const dependencies = createRegisterDependencies();
    const result = await registerOwnerAccount(validInput, dependencies);

    expect(result).toMatchObject({
      ok: true,
      organizationId: workspace.organizationId,
      userId: "user_1",
    });
    expect(dependencies.createAuthUser).toHaveBeenCalledWith(validInput);
    expect(dependencies.createOwnerWorkspace).toHaveBeenCalledWith({
      ...validInput,
      userId: "user_1",
    });
    expect(dependencies.signIn).toHaveBeenCalledWith({
      email: validInput.email,
      password: validInput.password,
    });
  });

  it("returns a friendly registration error when auth user creation fails", async () => {
    const dependencies = createRegisterDependencies({
      createAuthUser: vi.fn().mockResolvedValue({
        error: {
          message: "email rate limit exceeded",
          name: "AuthApiError",
        },
        userId: null,
      }),
    });
    const result = await registerOwnerAccount(validInput, dependencies);

    expect(result).toMatchObject({
      ok: false,
      reason: "auth_user_create_failed",
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("limitou tentativas");
    expect(dependencies.createOwnerWorkspace).not.toHaveBeenCalled();
  });

  it("removes the auth user when workspace creation fails", async () => {
    const dependencies = createRegisterDependencies({
      createOwnerWorkspace: vi.fn().mockRejectedValue(new Error("database failed")),
    });
    const result = await registerOwnerAccount(validInput, dependencies);

    expect(result).toMatchObject({
      ok: false,
      reason: "workspace_create_failed",
    });
    expect(dependencies.deleteAuthUser).toHaveBeenCalledWith("user_1");
  });

  it("removes workspace and auth user when session creation fails after registration", async () => {
    const dependencies = createRegisterDependencies({
      signIn: vi.fn().mockResolvedValue({
        error: {
          message: "invalid login credentials",
        },
        ok: false,
      }),
    });
    const result = await registerOwnerAccount(validInput, dependencies);

    expect(result).toMatchObject({
      ok: false,
      reason: "session_create_failed",
    });
    expect(dependencies.deleteOwnerWorkspace).toHaveBeenCalledWith(workspace);
    expect(dependencies.deleteAuthUser).toHaveBeenCalledWith("user_1");
  });

  it("authenticates login and confirms the user has an active tenant profile", async () => {
    const signIn = vi.fn().mockResolvedValue({ ok: true });
    const getTenantProfile = vi.fn().mockResolvedValue(true);
    const result = await loginWithPassword(loginInput, {
      getTenantProfile,
      signIn,
      signOut: vi.fn(),
    });

    expect(result).toEqual({ ok: true });
    expect(signIn).toHaveBeenCalledWith({
      email: validInput.email,
      password: validInput.password,
    });
    expect(getTenantProfile).toHaveBeenCalled();
  });

  it("returns a friendly login error for invalid credentials", async () => {
    const result = await loginWithPassword(loginInput, {
      getTenantProfile: vi.fn(),
      signIn: vi.fn().mockResolvedValue({
        error: {
          message: "Invalid login credentials",
        },
        ok: false,
      }),
      signOut: vi.fn(),
    });

    expect(result).toMatchObject({
      message: "E-mail ou senha invalidos.",
      ok: false,
      reason: "login_failed",
    });
  });

  it("signs out and blocks login when the account has no active organization", async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    const result = await loginWithPassword(loginInput, {
      getTenantProfile: vi.fn().mockResolvedValue(false),
      signIn: vi.fn().mockResolvedValue({ ok: true }),
      signOut,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "missing_tenant_profile",
    });
    expect(signOut).toHaveBeenCalled();
  });
});

function createRegisterDependencies(
  overrides: Partial<RegisterOwnerDependencies> = {},
): RegisterOwnerDependencies {
  return {
    createAuthUser: vi.fn().mockResolvedValue({ userId: "user_1" }),
    createOwnerWorkspace: vi.fn().mockResolvedValue(workspace),
    deleteAuthUser: vi.fn().mockResolvedValue(undefined),
    deleteOwnerWorkspace: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
}
