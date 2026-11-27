import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** Filled ribbon traced from the supplied Alfa prop reference: roof and inward fold. */
const MARK = "M110 10H193C207 10 218 17 226 29L293 132C302 145 302 157 295 171L264 228C257 240 246 246 231 246H177C162 246 149 238 142 226L123 196C117 186 117 176 123 166L144 130C150 119 165 119 172 131L216 201C222 212 234 212 240 201L271 149C274 143 274 138 270 132L211 42C205 31 191 31 185 42L68 235C62 245 48 249 40 236L14 192C6 179 6 165 14 152L80 29C88 16 96 10 110 10Z";

/**
 * Brand icon: a bold filled ribbon shaped like a roof with an inner fold.
 * Brand orange on both light and dark backgrounds.
 */
export function LogoMark({ className }: { className?: string; light?: boolean }) {
  return (
    <svg viewBox="0 0 310 256" className={cn("size-9 shrink-0", className)} aria-hidden>
      <path
        d={MARK}
        className="fill-primary"
      />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="دارك - الرئيسية">
      <LogoMark light={light} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.35rem] font-bold",
            light ? "text-ivory" : "text-primary",
          )}
        >
          دارك
        </span>
        <span
          className={cn(
            "mt-1 text-[10px] font-medium",
            light ? "text-ivory/75" : "text-muted-foreground",
          )}
        >
          عقارات المكلا
        </span>
      </span>
    </Link>
  );
}
