import { mockDashboardOverview } from "@/features/dashboard/mock-data";
import type { DashboardOverviewData } from "@/features/dashboard/types";

export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  // Future Supabase path:
  // 1. const organizationId = await requireCurrentOrganizationId();
  // 2. Query tenant-scoped tables with .eq("organization_id", organizationId).
  // 3. Aggregate conversations, customers, appointments, payments and handoffs.
  return mockDashboardOverview;
}
