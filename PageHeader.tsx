import { useRouter } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  back = false,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: boolean;
  actions?: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <div
      className={cn(
        "sticky top-0 z-30 border-b bg-background/90 backdrop-blur-lg md:static md:border-0 md:bg-transparent md:backdrop-blur-none",
        className,
      )}
    >
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 py-3 md:px-6 md:pt-8">
        {back && (
          <button
            type="button"
            onClick={() => router.history.back()}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-card shadow-soft transition hover:bg-muted"
            aria-label="رجوع"
          >
            <ArrowRight className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold md:text-3xl">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-6xl px-4 pb-safe-nav pt-4 md:px-6 md:pb-16", className)}>{children}</div>;
}
