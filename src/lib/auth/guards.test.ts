import { describe, expect, it } from "vitest";
import { resolveProtectedAppAccess } from "./guards";
import { routes } from "../routes";

describe("auth route guards", () => {
  it("redirects authenticated app routes when Supabase is configured and no profile exists", () => {
    expect(
      resolveProtectedAppAccess({
        hasTenantProfile: false,
        supabaseConfigured: true,
      }),
    ).toEqual({
      destination: routes.login,
      status: "redirect",
    });
  });

  it("allows app routes when the user has an active tenant profile", () => {
    expect(
      resolveProtectedAppAccess({
        hasTenantProfile: true,
        supabaseConfigured: true,
      }),
    ).toEqual({
      status: "allow",
    });
  });

  it("allows local scaffold previews when Supabase is not configured", () => {
    expect(
      resolveProtectedAppAccess({
        hasTenantProfile: false,
        supabaseConfigured: false,
      }),
    ).toEqual({
      status: "allow",
    });
  });
});
