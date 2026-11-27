import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogoMark } from "./Logo";

/**
 * Opening screen shown once each time the app is opened (full page load).
 * Rendered on the server too so it covers the page from the very first paint.
 */
export function SplashScreen() {
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const leave = window.setTimeout(() => setPhase("leaving"), reduced ? 600 : 1500);
    const gone = window.setTimeout(() => setPhase("gone"), reduced ? 800 : 2000);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      role="status"
      aria-label="جارٍ فتح تطبيق دارك"
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-splash text-foreground transition-opacity duration-500",
        phase === "leaving" && "pointer-events-none opacity-0",
      )}
    >
      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
        <LogoMark light className="size-24" />
        <p className="mt-5 font-display text-5xl font-bold">دارك</p>
        <p className="mt-2 text-sm text-muted-foreground">عقارات المكلا</p>
      </div>
      <span className="absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] h-1 w-24 overflow-hidden rounded-full bg-border">
        <span className="block h-full w-1/2 animate-splash-bar rounded-full bg-primary motion-reduce:animate-none" />
      </span>
    </div>
  );
}
