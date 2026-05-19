import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MessageResponse({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (typeof children !== "string") {
    return <div className={cn("text-sm leading-6 text-foreground", className)}>{children}</div>;
  }

  const paragraphs = children
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className={cn("space-y-3 text-sm leading-6 text-foreground", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 24)}-${index}`}>{renderInlineMarkdown(paragraph)}</p>
      ))}
    </div>
  );
}

function renderInlineMarkdown(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs text-foreground"
          key={`${part}-${index}`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
