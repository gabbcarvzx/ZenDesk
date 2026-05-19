import Link from "next/link";
import { Bot, FlaskConical } from "lucide-react";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: routes.aiPlayground,
    icon: FlaskConical,
    id: "playground",
    label: "Playground",
  },
  {
    href: routes.ai,
    icon: Bot,
    id: "knowledge-base",
    label: "Base de conhecimento",
  },
] as const;

export function AiTabs({ active }: { active: (typeof tabs)[number]["id"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;

        return (
          <Link
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition",
              isActive
                ? "border-primary bg-[#e5f2ee] text-primary"
                : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground",
            )}
            href={tab.href}
            key={tab.href}
          >
            <Icon aria-hidden="true" className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
