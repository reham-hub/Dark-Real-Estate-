import { Link, useLocation } from "@tanstack/react-router";
import { Heart, Home, MessageCircle, Search, UserRound, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const items = [
  { to: "/", label: "الرئيسية", icon: Home, exact: true },
  { to: "/search", label: "البحث", icon: Search },
  { to: "/favorites", label: "المفضلة", icon: Heart },
  { to: "/messages", label: "الرسائل", icon: MessageCircle },
  { to: "/account", label: "حسابي", icon: UserRound },
] as const;

const HIDE_BOTTOM_ON = [/^\/messages\/.+/, /^\/login/, /^\/register/, /^\/forgot-password/, /^\/property\//, /^\/owner\/new/, /^\/owner\/.+\/edit/];

export function BottomNav() {
  const { pathname } = useLocation();
  const { unreadCount } = useStore();
  if (HIDE_BOTTOM_ON.some((r) => r.test(pathname))) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="التنقل الرئيسي"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ to, label, icon: Icon, ...rest }) => {
          const active = "exact" in rest ? pathname === to : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-14 place-items-center rounded-full transition-colors",
                    active && "bg-primary-soft",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
                {to === "/messages" && unreadCount > 0 && (
                  <span className="absolute top-1.5 left-1/2 ml-2 grid min-w-4 place-items-center rounded-full bg-clay px-1 text-[10px] font-bold text-clay-foreground">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DesktopNav() {
  const { pathname } = useLocation();
  const { currentUser, unreadCount } = useStore();
  return (
    <header className="sticky top-0 z-40 hidden border-b bg-card/90 backdrop-blur-lg md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Logo />
        <nav className="flex items-center gap-1">
          {items.map(({ to, label, icon: Icon, ...rest }) => {
            const active = "exact" in rest ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary-soft text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
                {to === "/messages" && unreadCount > 0 && (
                  <span className="grid min-w-5 place-items-center rounded-full bg-clay px-1 text-[10px] font-bold text-clay-foreground">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
          {currentUser && currentUser.role !== "admin" && (
            <Link
              to="/owner"
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                pathname.startsWith("/owner") ? "bg-primary-soft text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutDashboard className="size-4" /> لوحة المالك
            </Link>
          )}
          {currentUser?.role === "admin" && (
            <Link
              to="/admin"
              search={{ tab: "overview" }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                pathname.startsWith("/admin") ? "bg-primary-soft text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ShieldCheck className="size-4" /> لوحة الإدارة
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
