import { Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-primary p-10 text-primary-foreground md:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
            <BarChart3 className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">Retailyn</span>
        </Link>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight">Turn retail data into revenue.</h2>
          <p className="max-w-sm text-sm text-primary-foreground/80">
            Join thousands of teams using AI to surface what's working — and what's not — in their stores.
          </p>
        </div>
        <div className="relative text-xs text-primary-foreground/70">© 2026 Retailyn</div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm animate-fade-in">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8 space-y-4">{children}</div>
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  );
}