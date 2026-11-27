import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserCog,
  UserPlus,
  LogIn,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { VerificationBadge } from "@/components/dark/Badges";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
import { LogoMark } from "@/components/dark/Logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, initials } from "@/lib/format";
import { fullName, useStore } from "@/lib/store";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "حسابي | دارك" },
      { name: "description", content: "إدارة حسابك وتوثيق هويتك والوصول إلى لوحة المالك في دارك." },
      { property: "og:title", content: "حسابي | دارك" },
      { property: "og:description", content: "إدارة حسابك في دارك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { currentUser, hydrated, getVerificationStatus, logout, favoriteIds, unreadCount, properties } = useStore();
  const navigate = useNavigate();

  if (!hydrated)
    return (
      <PageBody>
        <Skeleton className="h-40 rounded-3xl" />
      </PageBody>
    );

  if (!currentUser)
    return (
      <>
        <PageHeader title="حسابي" />
        <PageBody>
          <div className="relative overflow-hidden rounded-3xl bg-hero p-6 text-primary-foreground shadow-card">
            <div className="pattern-arches absolute inset-0 opacity-70" aria-hidden />
            <div className="relative">
              <LogoMark light className="size-14" />
              <h2 className="mt-4 font-display text-2xl font-bold">أهلًا بك في دارك</h2>
              <p className="mt-1 text-sm opacity-85">سجّل الدخول لحفظ المفضلة، مراسلة الملاك، ونشر عقاراتك.</p>
              <div className="mt-5 flex gap-2">
                <Button asChild variant="glass">
                  <Link to="/login" search={{}}>
                    <LogIn /> تسجيل الدخول
                  </Link>
                </Button>
                <Button asChild variant="clay">
                  <Link to="/register">
                    <UserPlus /> حساب جديد
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </PageBody>
      </>
    );

  const isAdmin = currentUser.role === "admin";
  const ver = getVerificationStatus(currentUser.id);
  const myCount = properties.filter((p) => p.ownerId === currentUser.id).length;

  return (
    <>
      <PageHeader title="حسابي" />
      <PageBody className="max-w-2xl space-y-5">
        <section className="rounded-3xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">
                {initials(currentUser.firstName, currentUser.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-xl font-bold">{fullName(currentUser)}</h2>
              <p className="text-xs text-muted-foreground">عضو منذ {formatDate(currentUser.joinDate)}</p>
              <div className="mt-2">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                    <ShieldCheck className="size-3.5" /> مدير المنصة
                  </span>
                ) : (
                  <VerificationBadge status={ver} />
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 border-t pt-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Mail className="size-4" /> <span dir="ltr">{currentUser.email}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-4" /> <span dir="ltr">+967 {currentUser.phone}</span>
            </p>
          </div>
        </section>

        {!isAdmin && ver !== "approved" && (
          <Link to="/verify" className="flex items-center gap-3 rounded-3xl bg-clay-soft p-4 transition hover:shadow-soft">
            <span className="grid size-11 place-items-center rounded-2xl bg-clay text-clay-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-bold">{ver === "pending" ? "طلب التوثيق قيد المراجعة" : "وثّق هويتك لنشر العقارات"}</p>
              <p className="text-xs text-muted-foreground">
                {ver === "pending" ? "ستتم مراجعة وثيقتك من الإدارة قريبًا" : "التوثيق مطلوب قبل إضافة أي عقار"}
              </p>
            </div>
            <ChevronLeft className="size-5 text-muted-foreground" />
          </Link>
        )}

        <section className="overflow-hidden rounded-3xl bg-card shadow-soft">
          {isAdmin ? (
            <MenuItem to="/admin" icon={ShieldCheck} label="لوحة الإدارة" hint="المستخدمون، العقارات، البلاغات" />
          ) : (
            <>
              <MenuItem to="/owner" icon={LayoutDashboard} label="لوحة المالك" hint={`${myCount} عقارات`} />
              <MenuItem to="/favorites" icon={Heart} label="المفضلة" hint={`${favoriteIds.length}`} />
              <MenuItem to="/messages" icon={MessageCircle} label="الرسائل" hint={unreadCount ? `${unreadCount} غير مقروءة` : undefined} />
              <MenuItem to="/verify" icon={ShieldCheck} label="توثيق الهوية" />
            </>
          )}
          <MenuItem to="/account/edit" icon={UserCog} label="تعديل بيانات الحساب" hint="الاسم، البريد، الجوال، كلمة المرور" />
        </section>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="lg" className="w-full text-destructive hover:text-destructive">
              <LogOut /> تسجيل الخروج
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl" className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>تسجيل الخروج؟</AlertDialogTitle>
              <AlertDialogDescription>ستحتاج إلى تسجيل الدخول مجددًا للوصول إلى حسابك.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  logout();
                  toast.success("تم تسجيل الخروج");
                  navigate({ to: "/" });
                }}
              >
                تسجيل الخروج
              </AlertDialogAction>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageBody>
    </>
  );
}

function MenuItem({
  to,
  icon: Icon,
  label,
  hint,
}: {
  to: "/owner" | "/favorites" | "/messages" | "/verify" | "/account/edit" | "/admin";
  icon: LucideIcon;
  label: string;
  hint?: string | undefined;
}) {
  return (
    <Link
      to={to}
      search={to === "/admin" ? { tab: "overview" } : {}}
      className="flex items-center gap-3 border-b px-4 py-4 transition last:border-0 hover:bg-muted/60"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <ChevronLeft className="size-5 text-muted-foreground" />
    </Link>
  );
}
