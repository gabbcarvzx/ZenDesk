export function KnowledgeBaseFieldError({ error }: { error?: string }) {
  if (!error) {
    return null;
  }

  return <p className="text-sm font-medium text-danger">{error}</p>;
}
