import { CatalogStatusMessage } from "@/features/catalog/components/catalog-status-message";

export function CatalogWarning({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <CatalogStatusMessage message={message} tone="error" />;
}
