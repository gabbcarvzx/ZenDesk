export default function KnowledgeBaseLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="h-36 animate-pulse rounded-lg border border-border bg-surface" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="h-96 animate-pulse rounded-lg border border-border bg-surface" />
          <div className="h-80 animate-pulse rounded-lg border border-border bg-surface" />
        </div>
        <div className="h-72 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    </div>
  );
}
