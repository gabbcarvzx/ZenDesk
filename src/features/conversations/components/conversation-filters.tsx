import Link from "next/link";
import { conversationFilterOptions } from "@/features/conversations/schema";
import type { ConversationFilter } from "@/features/conversations/types";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function ConversationFilters({ filter }: { filter: ConversationFilter }) {
  return (
    <div className="flex flex-wrap gap-2">
      {conversationFilterOptions.map((option) => {
        const isActive = option.value === filter;

        return (
          <Link
            className={cn(
              "inline-flex h-10 items-center rounded-md border px-3 text-sm font-semibold transition",
              isActive
                ? "border-primary bg-[#e5f2ee] text-primary"
                : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground",
            )}
            href={`${routes.conversations}?filter=${option.value}`}
            key={option.value}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
