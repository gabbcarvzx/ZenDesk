"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrganizationRole } from "@/lib/tenant.server";
import {
  parseKnowledgeBaseForm,
  parseKnowledgeBaseIdForm,
  parseKnowledgeBaseStatusUpdateForm,
  parseKnowledgeBaseUpdateForm,
  type KnowledgeBaseActionState,
} from "@/features/ai/knowledge-base/schema";

const knowledgeBasePaths = ["/app/ai", "/app/ai/knowledge-base"];

export async function createKnowledgeBaseItemAction(
  _previousState: KnowledgeBaseActionState,
  formData: FormData,
): Promise<KnowledgeBaseActionState> {
  const parsed = parseKnowledgeBaseForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados do conhecimento.",
      status: "error",
    };
  }

  return saveKnowledgeBaseMutation(async () => {
    const profile = await requireOrganizationRole(["owner"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    const { error } = await supabase.from("ai_knowledge_base").insert({
      category: values.category || null,
      content: values.content,
      organization_id: profile.organizationId,
      priority: values.priority,
      source_type: "manual",
      status: values.status,
      title: values.title,
    });

    if (error) {
      throw error;
    }

    return "Conhecimento criado com sucesso.";
  });
}

export async function updateKnowledgeBaseItemAction(
  _previousState: KnowledgeBaseActionState,
  formData: FormData,
): Promise<KnowledgeBaseActionState> {
  const parsed = parseKnowledgeBaseUpdateForm(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados do conhecimento.",
      status: "error",
    };
  }

  return saveKnowledgeBaseMutation(async () => {
    const profile = await requireOrganizationRole(["owner"]);
    const supabase = await createSupabaseServerClient();
    const values = parsed.data;

    const { error } = await supabase
      .from("ai_knowledge_base")
      .update({
        category: values.category || null,
        content: values.content,
        priority: values.priority,
        status: values.status,
        title: values.title,
      })
      .eq("id", values.id)
      .eq("organization_id", profile.organizationId);

    if (error) {
      throw error;
    }

    return "Conhecimento atualizado com sucesso.";
  });
}

export async function updateKnowledgeBaseStatusAction(formData: FormData): Promise<void> {
  const parsed = parseKnowledgeBaseStatusUpdateForm(formData);

  if (!parsed.success || !isSupabaseConfigured()) {
    return;
  }

  try {
    const profile = await requireOrganizationRole(["owner"]);
    const supabase = await createSupabaseServerClient();

    await supabase
      .from("ai_knowledge_base")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.id)
      .eq("organization_id", profile.organizationId);

    revalidateKnowledgeBasePaths();
  } catch {
    // The UI remains unchanged when authorization or status update fails.
  }
}

export async function deleteKnowledgeBaseItemAction(formData: FormData): Promise<void> {
  const parsed = parseKnowledgeBaseIdForm(formData);

  if (!parsed.success || !isSupabaseConfigured()) {
    return;
  }

  try {
    const profile = await requireOrganizationRole(["owner"]);
    const supabase = await createSupabaseServerClient();

    await supabase
      .from("ai_knowledge_base")
      .delete()
      .eq("id", parsed.data.id)
      .eq("organization_id", profile.organizationId);

    revalidateKnowledgeBasePaths();
  } catch {
    // The UI remains unchanged when authorization or deletion fails.
  }
}

async function saveKnowledgeBaseMutation(
  mutation: () => Promise<string>,
): Promise<KnowledgeBaseActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Supabase nao esta configurado neste ambiente.",
      status: "error",
    };
  }

  try {
    const message = await mutation();
    revalidateKnowledgeBasePaths();

    return {
      message,
      status: "success",
    };
  } catch {
    return {
      message: "Nao foi possivel salvar. Verifique sua permissao e tente novamente.",
      status: "error",
    };
  }
}

function revalidateKnowledgeBasePaths() {
  for (const path of knowledgeBasePaths) {
    revalidatePath(path);
  }
}
