import Link from "next/link";
import { appConfig } from "@/lib/app-config";

export function BrandLogo() {
  return (
    <Link className="inline-flex items-center gap-3" href="/">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
      >
        IA
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold text-foreground">{appConfig.name}</span>
        <span className="mt-1 text-xs font-medium uppercase text-muted">
          WhatsApp IA
        </span>
      </span>
    </Link>
  );
}
