export type CatalogStatus = "active" | "inactive";

export type CatalogProduct = {
  category: string | null;
  createdAt: string;
  description: string | null;
  id: string;
  name: string;
  priceCents: number;
  status: CatalogStatus;
  stockQuantity: number | null;
};

export type CatalogService = {
  category: string | null;
  createdAt: string;
  description: string | null;
  durationMinutes: number;
  id: string;
  name: string;
  priceCents: number;
  status: CatalogStatus;
};

export type CatalogPageData = {
  canManage: boolean;
  loadError?: string;
  products: CatalogProduct[];
  services: CatalogService[];
};
