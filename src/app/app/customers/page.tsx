import type { Metadata } from "next";
import { CustomerCreateForm } from "@/features/customers/components/customer-create-form";
import { CustomerDetail } from "@/features/customers/components/customer-detail";
import { CustomerList } from "@/features/customers/components/customer-list";
import { CustomerSearch } from "@/features/customers/components/customer-search";
import { CustomerStatusMessage } from "@/features/customers/components/customer-status-message";
import { CustomersOverview } from "@/features/customers/components/customers-overview";
import { CustomersShell } from "@/features/customers/components/customers-shell";
import { getCustomersPageData } from "@/features/customers/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clientes",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ customer?: string; q?: string }>;
}) {
  const params = await searchParams;
  const data = await getCustomersPageData({
    search: params?.q,
    selectedCustomerId: params?.customer,
  });

  return (
    <CustomersShell
      description="Centralize clientes, tags, observacoes internas e historicos comerciais sem misturar dados entre organizacoes."
      title="Clientes"
    >
      {data.loadError ? (
        <CustomerStatusMessage message={data.loadError} tone="error" />
      ) : null}
      <CustomersOverview customers={data.customers} />
      <CustomerSearch search={data.search} />
      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-6">
          <CustomerCreateForm canManage={data.canManage} />
          <CustomerList
            customers={data.customers}
            search={data.search}
            selectedCustomerId={data.selectedCustomer?.id}
          />
        </div>
        <CustomerDetail
          appointments={data.appointments}
          canManage={data.canManage}
          conversations={data.conversations}
          customer={data.selectedCustomer}
        />
      </div>
    </CustomersShell>
  );
}
