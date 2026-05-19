import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CustomersLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="h-4 w-20 rounded-md bg-surface-muted" />
        <div className="mt-4 h-8 w-44 max-w-full rounded-md bg-surface-muted" />
        <div className="mt-3 h-4 w-full max-w-3xl rounded-md bg-surface-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <CardContent className="p-5">
              <div className="h-4 w-28 rounded-md bg-surface-muted" />
              <div className="mt-4 h-8 w-16 rounded-md bg-surface-muted" />
              <div className="mt-3 h-4 w-full rounded-md bg-surface-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader>
            <div className="h-5 w-36 rounded-md bg-surface-muted" />
            <div className="mt-3 h-4 w-full rounded-md bg-surface-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-40 rounded-md bg-surface-muted" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-5 w-44 rounded-md bg-surface-muted" />
            <div className="mt-3 h-4 w-full rounded-md bg-surface-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-64 rounded-md bg-surface-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
