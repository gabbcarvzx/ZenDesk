import { KnowledgeBaseStatusMessage } from "@/features/ai/knowledge-base/components/knowledge-base-status-message";

export function KnowledgeBaseWarning({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <KnowledgeBaseStatusMessage message={message} tone="error" />;
}
