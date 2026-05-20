import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { featureEnvKeys } from "@/lib/env";
import {
  buildDeploymentChecklist,
  mapOnboardingProgressRow,
  type ReadinessSnapshot,
} from "@/features/training/queries";

describe("onboarding production readiness helpers", () => {
  it("calculates checklist from the current tenant snapshot only", () => {
    withIntegrationEnv("ready", () => {
      const tenantA = buildDeploymentChecklist({
        planSlug: "pro",
        snapshot: buildSnapshot({
          activeKnowledgeCount: 2,
          businessReady: true,
          conversationCount: 3,
          paymentCount: 1,
          productCount: 2,
          serviceCount: 1,
        }),
      });
      const tenantB = buildDeploymentChecklist({
        planSlug: "starter",
        snapshot: buildSnapshot({
          activeKnowledgeCount: 0,
          businessReady: false,
          conversationCount: 0,
          paymentCount: 0,
          productCount: 0,
          serviceCount: 0,
        }),
      });

      expect(findChecklistStatus(tenantA, "business")).toBe("done");
      expect(findChecklistStatus(tenantA, "catalog")).toBe("done");
      expect(findChecklistStatus(tenantA, "pix")).toBe("done");
      expect(findChecklistStatus(tenantB, "business")).toBe("missing");
      expect(findChecklistStatus(tenantB, "catalog")).toBe("missing");
      expect(findChecklistStatus(tenantB, "pix")).toBe("warning");
    });
  });

  it("keeps WhatsApp and Pix partial when integration env vars are missing", () => {
    withIntegrationEnv("missing", () => {
      const checklist = buildDeploymentChecklist({
        planSlug: "pro",
        snapshot: buildSnapshot({
          activeKnowledgeCount: 1,
          businessReady: true,
          conversationCount: 1,
          paymentCount: 1,
          productCount: 1,
          serviceCount: 0,
        }),
      });

      expect(findChecklistStatus(checklist, "whatsapp")).toBe("warning");
      expect(findChecklistStatus(checklist, "pix")).toBe("warning");
    });
  });

  it("sanitizes invalid persisted onboarding progress values", () => {
    const progress = mapOnboardingProgressRow({
      completed_at: null,
      completed_steps: ["welcome", "invalid-step", "ai-test"],
      current_step: "outside-flow",
      demo_mode_enabled: true,
      payload: {
        businessName: "  Loja Teste  ",
        pixProvider: "unknown",
        toneOfVoice: "agressivo",
      },
    });

    expect(progress.currentStep).toBe("welcome");
    expect(progress.completedSteps).toEqual(["welcome", "ai-test"]);
    expect(progress.demoModeEnabled).toBe(true);
    expect(progress.payload.businessName).toBe("Loja Teste");
    expect(progress.payload.pixProvider).toBeUndefined();
    expect(progress.payload.toneOfVoice).toBeUndefined();
  });

  it("keeps onboarding_progress migration hardened for RLS and bounded payloads", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260519170000_add_onboarding_progress.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("alter table public.onboarding_progress enable row level security");
    expect(migration).toContain("alter table public.onboarding_progress force row level security");
    expect(migration).toContain("onboarding_progress_completed_steps_check");
    expect(migration).toContain("onboarding_progress_payload_object_check");
    expect(migration).toContain("onboarding_progress_payload_size_check");
    expect(migration).toContain("revoke all on table public.onboarding_progress from anon");
    expect(migration).toContain("public.is_member_of_organization(organization_id)");
    expect(migration).toContain("array['owner', 'admin']::public.profile_role[]");
  });
});

function buildSnapshot({
  activeKnowledgeCount,
  businessReady,
  conversationCount,
  paymentCount,
  productCount,
  serviceCount,
}: {
  activeKnowledgeCount: number;
  businessReady: boolean;
  conversationCount: number;
  paymentCount: number;
  productCount: number;
  serviceCount: number;
}): ReadinessSnapshot {
  return {
    activeKnowledgeCount,
    businessSettings: businessReady
      ? {
          ai_enabled: true,
          business_description: "Atendimento completo para clientes locais.",
          business_hours: "Segunda a sexta, 08:00 as 18:00.",
          business_name: "Empresa Teste",
          human_handoff_message: "Vou chamar uma pessoa da equipe.",
          industry: "Servicos locais",
          tone_of_voice: "profissional",
          welcome_message: "Ola, como posso ajudar?",
          whatsapp_phone_number_id: "123456789",
        }
      : {
          ai_enabled: false,
          business_description: null,
          business_hours: null,
          business_name: null,
          human_handoff_message: null,
          industry: null,
          tone_of_voice: null,
          welcome_message: null,
          whatsapp_phone_number_id: null,
        },
    conversationCount,
    onboarding: {
      completedAt: null,
      completedSteps: ["welcome", "business", "ai-test"],
      currentStep: "finish",
      demoModeEnabled: false,
      payload: {
        aiTestExpectedAnswer: "Responder horario, preco e proximo passo.",
        aiTestScenario: "Quero saber valores e horarios.",
        pixInstructions: "Enviar somente apos confirmar valor.",
        pixKey: "financeiro@example.com",
        pixProvider: "mercado_pago",
      },
    },
    paymentCount,
    productCount,
    serviceCount,
  };
}

function findChecklistStatus(
  checklist: ReturnType<typeof buildDeploymentChecklist>,
  id: string,
) {
  return checklist.items.find((item) => item.id === id)?.status;
}

function withIntegrationEnv(mode: "missing" | "ready", callback: () => void) {
  const keys = [...featureEnvKeys.whatsapp, ...featureEnvKeys.mercadoPago];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));

  try {
    for (const key of keys) {
      if (mode === "ready") {
        process.env[key] = "test-value";
      } else {
        delete process.env[key];
      }
    }

    callback();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
