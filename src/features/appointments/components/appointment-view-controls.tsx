import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { appointmentViewOptions } from "@/features/appointments/schema";
import { getAdjacentDate } from "@/features/appointments/queries";
import type { AppointmentViewMode } from "@/features/appointments/types";
import { routes } from "@/lib/routes";

export function AppointmentViewControls({
  date,
  rangeLabel,
  view,
}: {
  date: string;
  rangeLabel: string;
  view: AppointmentViewMode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Visualizacao
          </p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{rangeLabel}</h3>
        </div>
        <form className="grid gap-3 sm:grid-cols-[150px_150px_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="appointment-view">Periodo</Label>
            <Select id="appointment-view" name="view" defaultValue={view}>
              {appointmentViewOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appointment-date">Data</Label>
            <Input id="appointment-date" name="date" type="date" defaultValue={date} />
          </div>
          <Button type="submit">Aplicar</Button>
        </form>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PeriodLink date={getAdjacentDate(date, view, -1)} view={view}>
          <ChevronLeft aria-hidden="true" className="size-4" />
          Anterior
        </PeriodLink>
        <PeriodLink date={getAdjacentDate(date, view, 1)} view={view}>
          Proximo
          <ChevronRight aria-hidden="true" className="size-4" />
        </PeriodLink>
        <Link
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground"
          href={routes.appointments}
        >
          Hoje
        </Link>
      </div>
    </section>
  );
}

function PeriodLink({
  children,
  date,
  view,
}: {
  children: ReactNode;
  date: string;
  view: AppointmentViewMode;
}) {
  const params = new URLSearchParams({ date, view });

  return (
    <Link
      className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground"
      href={`${routes.appointments}?${params.toString()}`}
    >
      {children}
    </Link>
  );
}
