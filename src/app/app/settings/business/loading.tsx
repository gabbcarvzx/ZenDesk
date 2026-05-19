import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function BusinessSettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="h-4 w-32 rounded-md bg-surface-muted" />
        <div className="mt-4 h-8 w-80 max-w-full rounded-md bg-surface-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md bg-surface-muted" />
      </div>
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardHeader>
            <div className="h-5 w-52 rounded-md bg-surface-muted" />
            <div className="mt-3 h-4 w-full max-w-xl rounded-md bg-surface-muted" />
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="h-11 rounded-md bg-surface-muted" />
            <div className="h-11 rounded-md bg-surface-muted" />
            <div className="h-28 rounded-md bg-surface-muted md:col-span-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
