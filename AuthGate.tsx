import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LogIn, ShieldX } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";
import { EmptyState } from "./EmptyState";

export function AuthGate({
  children,
  admin = false,
  message = "سجّل الدخول للوصول إلى هذه الصفحة",
}: {
  children: ReactNode;
  admin?: boolean;
  message?: string;
}) {
  const { hydrated, currentUser } = useStore();
  const { pathname } = useLocation();

  if (!hydrated)
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-20 w-full rounded-3xl" />
      </div>
    );

  if (!currentUser)
    return (
      <EmptyState
        icon={LogIn}
        title="مطلوب تسجيل الدخول"
        description={message}
        action={
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/login" search={{ redirect: pathname }}>
                تسجيل الدخول
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/register">إنشاء حساب</Link>
            </Button>
          </div>
        }
      />
    );

  if (admin && currentUser.role !== "admin")
    return (
      <EmptyState
        icon={ShieldX}
        title="غير مصرح لك"
        description="هذه الصفحة مخصصة لإدارة المنصة فقط."
        action={
          <Button asChild variant="outline">
            <Link to="/">العودة للرئيسية</Link>
          </Button>
        }
      />
    );

  return <>{children}</>;
}

/** Returns a guard that prompts sign-in when the visitor is a guest. */
export function useRequireLogin() {
  const { currentUser } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (message = "سجّل الدخول للمتابعة") => {
    if (currentUser) return true;
    toast(message, {
      action: {
        label: "تسجيل الدخول",
        onClick: () => navigate({ to: "/login", search: { redirect: pathname } }),
      },
    });
    return false;
  };
}
