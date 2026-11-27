import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "./Logo";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background md:grid md:min-h-[calc(100dvh-4rem)] md:place-items-center md:py-10">
      <div className="relative overflow-hidden bg-hero px-5 pb-16 pt-5 text-primary-foreground md:hidden">
        <div className="pattern-arches absolute inset-0 opacity-70" aria-hidden />
        <Link to="/" className="relative grid size-10 place-items-center rounded-full bg-primary-foreground/15" aria-label="الرئيسية">
          <ArrowRight className="size-5" />
        </Link>
        <div className="relative mt-6 flex items-center gap-3">
          <LogoMark light className="size-12" />
          <div>
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="relative -mt-8 rounded-t-3xl bg-background px-5 pb-10 pt-7 md:mt-0 md:w-full md:max-w-md md:rounded-3xl md:bg-card md:p-8 md:shadow-card">
        <div className="mb-6 hidden items-center gap-3 md:flex">
          <LogoMark className="size-12" />
          <div>
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
