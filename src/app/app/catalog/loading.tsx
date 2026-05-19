import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CatalogLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="h-4 w-28 rounded-md bg-surface-muted" />
        <div className="mt-4 h-8 w-72 max-w-full rounded-md bg-surface-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md bg-surface-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <CardHeader>
              <div className="h-4 w-32 rounded-md bg-surface-muted" />
              <div className="mt-4 h-8 w-20 rounded-md bg-surface-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full rounded-md bg-surface-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
