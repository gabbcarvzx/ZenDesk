import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentTenantProfile } from "@/lib/tenant.server";
import type {
  KnowledgeBaseItem,
  KnowledgeBasePageData,
  KnowledgeBaseStatus,
} from "@/features/ai/knowledge-base/types";

type KnowledgeBaseStatusRow = KnowledgeBaseStatus | "draft" | "archived";

type KnowledgeBaseRow = {
  category: string | null;
  content: string;
  created_at: string;
  id: string;
  priority: number | null;
  status: KnowledgeBaseStatusRow;
  title: string;
};

export async function getKnowledgeBasePageData(): Promise<KnowledgeBasePageData> {
  if (!isSupabaseConfigured()) {
    return {
      canManage: false,
      items: [],
      loadError:
        "Supabase ainda nao esta configurado. Configure as variaveis de ambiente para usar a base de conhecimento.",
    };
  }

  try {
    const profile = await getCurrentTenantProfile();

    if (!profile) {
      return {
        canManage: false,
        items: [],
        loadError:
          "Entre com uma conta vinculada a uma organizacao para acessar a base de conhecimento.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("ai_knowledge_base")
      .select("id,title,content,category,priority,status,created_at")
      .eq("organization_id", profile.organizationId)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return {
        canManage: profile.role === "owner",
        items: [],
        loadError: "Nao foi possivel carregar a base de conhecimento.",
      };
    }

    return {
      canManage: profile.role === "owner",
      items: ((data ?? []) as unknown as KnowledgeBaseRow[]).map(mapKnowledgeBaseRow),
    };
  } catch {
    return {
      canManage: false,
      items: [],
      loadError:
        "Nao foi possivel validar sua organizacao para carregar a base de conhecimento.",
    };
  }
}

function mapKnowledgeBaseRow(row: KnowledgeBaseRow): KnowledgeBaseItem {
  return {
    category: row.category,
    content: row.content,
    createdAt: row.created_at,
    id: row.id,
    priority: row.priority ?? 3,
    status: normalizeStatus(row.status),
    title: row.title,
  };
}

function normalizeStatus(status: KnowledgeBaseStatusRow): KnowledgeBaseStatus {
  return status === "active" ? "active" : "inactive";
}
