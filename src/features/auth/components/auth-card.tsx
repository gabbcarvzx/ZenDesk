import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";

type AuthCardProps = {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

export function AuthCard({ children, description, footer, title }: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <BrandLogo />
      </div>
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        </div>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </div>
    </div>
  );
}
