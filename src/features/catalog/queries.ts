import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentTenantProfile } from "@/lib/tenant.server";
import type { CatalogPageData, CatalogProduct, CatalogService } from "@/features/catalog/types";

type ProductRow = {
  category: string | null;
  created_at: string;
  description: string | null;
  id: string;
  name: string;
  price_cents: number;
  status: "active" | "inactive";
  stock_quantity: number | null;
};

type ServiceRow = {
  category: string | null;
  created_at: string;
  description: string | null;
  duration_minutes: number | null;
  id: string;
  name: string;
  price_cents: number;
  status: "active" | "inactive";
};

export async function getCatalogPageData(): Promise<CatalogPageData> {
  if (!isSupabaseConfigured()) {
    return {
      canManage: false,
      loadError:
        "Supabase ainda nao esta configurado. Configure as variaveis de ambiente para usar o catalogo.",
      products: [],
      services: [],
    };
  }

  try {
    const profile = await getCurrentTenantProfile();

    if (!profile) {
      return {
        canManage: false,
        loadError: "Entre com uma conta vinculada a uma organizacao para acessar o catalogo.",
        products: [],
        services: [],
      };
    }

    const supabase = await createSupabaseServerClient();
    const [productsResult, servicesResult] = await Promise.all([
      supabase
        .from("products")
        .select("id,name,description,price_cents,stock_quantity,category,status,created_at")
        .eq("organization_id", profile.organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("services")
        .select("id,name,description,price_cents,duration_minutes,category,status,created_at")
        .eq("organization_id", profile.organizationId)
        .order("created_at", { ascending: false }),
    ]);

    if (productsResult.error || servicesResult.error) {
      return {
        canManage: profile.role === "owner" || profile.role === "admin",
        loadError: "Nao foi possivel carregar produtos e servicos.",
        products: [],
        services: [],
      };
    }

    return {
      canManage: profile.role === "owner" || profile.role === "admin",
      products: ((productsResult.data ?? []) as unknown as ProductRow[]).map(mapProductRow),
      services: ((servicesResult.data ?? []) as unknown as ServiceRow[]).map(mapServiceRow),
    };
  } catch {
    return {
      canManage: false,
      loadError: "Nao foi possivel validar sua organizacao para carregar o catalogo.",
      products: [],
      services: [],
    };
  }
}

function mapProductRow(row: ProductRow): CatalogProduct {
  return {
    category: row.category,
    createdAt: row.created_at,
    description: row.description,
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    status: row.status,
    stockQuantity: row.stock_quantity,
  };
}

function mapServiceRow(row: ServiceRow): CatalogService {
  return {
    category: row.category,
    createdAt: row.created_at,
    description: row.description,
    durationMinutes: row.duration_minutes ?? 0,
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    status: row.status,
  };
}
