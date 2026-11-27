import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  BadgeCheck,
  Building2,
  Check,
  ChevronLeft,
  Clock,
  ExternalLink,
  Flag,
  IdCard,
  LayoutGrid,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/dark/AuthGate";
import { ApprovalBadge, StatusBadge, VerificationBadge } from "@/components/dark/Badges";
import { EmptyState } from "@/components/dark/EmptyState";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
import { RejectDialog } from "@/components/dark/RejectDialog";
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
import { Input } from "@/components/ui/input";
import { docTypeLabel, purposeLabel, typeLabel } from "@/lib/constants";
import { formatDate, formatPrice, initials, num, timeAgo } from "@/lib/format";
import { imgSrc } from "@/lib/images";
import { fullName, useStore } from "@/lib/store";
import type { ApprovalStatus, ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = ["overview", "properties", "verifications", "users", "reports"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/admin")({
  validateSearch: (raw: Record<string, unknown>): { tab: Tab } => {
    const t = raw["tab"] as Tab;
    return { tab: TABS.includes(t) ? t : "overview" };
  },
  head: () => ({
    meta: [
      { title: "لوحة الإدارة | دارك" },
      { name: "description", content: "إدارة المستخدمين والعقارات والبلاغات وطلبات التوثيق في دارك." },
      { property: "og:title", content: "لوحة الإدارة | دارك" },
      { property: "og:description", content: "لوحة تحكم إدارة منصة دارك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <>
      <PageHeader title="لوحة الإدارة" subtitle="إدارة المنصة والعمليات الإدارية" />
      <PageBody>
        <AuthGate admin message="سجّل الدخول بحساب الإدارة">
          <Admin />
        </AuthGate>
      </PageBody>
    </>
  );
}

function Admin() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin" });
  const { properties, verifications, reports } = useStore();
  const pendingProps = properties.filter((p) => p.approval === "pending").length;
  const pendingVer = verifications.filter((v) => v.status === "pending").length;
  const openReports = reports.filter((r) => r.status === "open").length;

  const tabs: { key: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { key: "overview", label: "نظرة عامة", icon: LayoutGrid },
    { key: "properties", label: "العقارات", icon: Building2, count: pendingProps },
    { key: "verifications", label: "التوثيق", icon: IdCard, count: pendingVer },
    { key: "users", label: "المستخدمون", icon: Users },
    { key: "reports", label: "البلاغات", icon: Flag, count: openReports },
  ];
  const setTab = (t: Tab) => navigate({ search: { tab: t }, replace: true });

  return (
    <div className="space-y-5">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === t.key ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-muted-foreground shadow-soft",
            )}
          >
            <t.icon className="size-4" />
            {t.label}
            {!!t.count && (
              <span className={cn("grid min-w-5 place-items-center rounded-full px-1 text-[11px]", tab === t.key ? "bg-primary-foreground/20" : "bg-clay text-clay-foreground")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview setTab={setTab} />}
      {tab === "properties" && <PropertiesAdmin />}
      {tab === "verifications" && <VerificationsAdmin />}
      {tab === "users" && <UsersAdmin />}
      {tab === "reports" && <ReportsAdmin />}
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ setTab }: { setTab: (t: Tab) => void }) {
  const { users, properties, verifications, reports, reviews } = useStore();
  const normal = users.filter((u) => u.role !== "admin");
  const stats = [
    { label: "المستخدمون", value: normal.length, icon: Users, cls: "bg-primary-soft text-primary" },
    { label: "عقارات منشورة", value: properties.filter((p) => p.approval === "approved").length, icon: Building2, cls: "bg-success-soft text-success" },
    { label: "ملاك موثّقون", value: verifications.filter((v) => v.status === "approved").length, icon: BadgeCheck, cls: "bg-clay-soft text-clay" },
    { label: "التقييمات", value: reviews.length, icon: UserCheck, cls: "bg-secondary text-secondary-foreground" },
  ];
  const queue = [
    { tab: "properties" as Tab, label: "عقارات بانتظار المراجعة", count: properties.filter((p) => p.approval === "pending").length, icon: Building2 },
    { tab: "verifications" as Tab, label: "طلبات توثيق الهوية", count: verifications.filter((v) => v.status === "pending").length, icon: IdCard },
    { tab: "reports" as Tab, label: "بلاغات مفتوحة", count: reports.filter((r) => r.status === "open").length, icon: Flag },
  ];
  const byCity = Object.entries(
    properties.filter((p) => p.approval === "approved").reduce<Record<string, number>>((m, p) => ({ ...m, [p.city]: (m[p.city] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxCity = Math.max(1, ...byCity.map((c) => c[1]));

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 shadow-soft">
            <span className={cn("grid size-10 place-items-center rounded-xl", s.cls)}>
              <s.icon className="size-5" />
            </span>
            <p className="mt-3 font-display text-3xl font-bold">{num(s.value)}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold">مهام بانتظارك</h2>
          <ul className="mt-3 divide-y">
            {queue.map((q) => (
              <li key={q.tab}>
                <button onClick={() => setTab(q.tab)} className="flex w-full items-center gap-3 py-3 text-right">
                  <span className={cn("grid size-10 place-items-center rounded-xl", q.count ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground")}>
                    <q.icon className="size-5" />
                  </span>
                  <span className="flex-1 font-medium">{q.label}</span>
                  <span className="font-display text-xl font-bold">{q.count}</span>
                  <ChevronLeft className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold">العقارات المنشورة حسب المدينة</h2>
          <ul className="mt-4 space-y-3">
            {byCity.map(([city, n]) => (
              <li key={city} className="text-sm">
                <div className="mb-1 flex justify-between">
                  <span>{city}</span>
                  <span className="font-semibold">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-clay" style={{ width: `${(n / maxCity) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ---------------- Properties ---------------- */
function PropertiesAdmin() {
  const { properties, userById, approveProperty, rejectProperty, deleteProperty } = useStore();
  const [filter, setFilter] = useState<ApprovalStatus | "all">("pending");
  const list = [...properties]
    .filter((p) => filter === "all" || p.approval === filter)
    .sort((a, b) => b.postDate.localeCompare(a.postDate));

  return (
    <div className="space-y-4">
      <FilterPills
        value={filter}
        onChange={setFilter}
        options={[
          ["pending", "بانتظار المراجعة", properties.filter((p) => p.approval === "pending").length],
          ["approved", "منشورة", properties.filter((p) => p.approval === "approved").length],
          ["rejected", "مرفوضة", properties.filter((p) => p.approval === "rejected").length],
          ["all", "الكل", properties.length],
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={Check} title="لا توجد عقارات هنا" description="تمت مراجعة جميع الطلبات." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((p) => {
            const owner = userById(p.ownerId);
            return (
              <li key={p.id} className="overflow-hidden rounded-3xl bg-card shadow-soft">
                <div className="flex gap-3 p-3">
                  <div className="relative">
                    <img src={imgSrc(p.images[0])} alt={p.title} className="size-24 rounded-2xl object-cover" />
                    <span className="absolute bottom-1 left-1 rounded-full bg-overlay/70 px-1.5 text-[10px] text-primary-foreground">{p.images.length} صور</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1">
                      <ApprovalBadge status={p.approval} />
                      <StatusBadge status={p.status} />
                    </div>
                    <h3 className="mt-1 line-clamp-1 text-sm font-bold">{p.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {typeLabel(p.type)} · {purposeLabel(p.purpose)} · {p.city}، {p.district}
                    </p>
                    <p className="text-sm font-bold text-primary">{formatPrice(p.price, p.purpose)}</p>
                    <p className="text-xs text-muted-foreground">
                      المالك: {fullName(owner)} · {timeAgo(p.postDate)}
                    </p>
                  </div>
                </div>
                {p.rejectReason && <p className="mx-3 mb-3 rounded-xl bg-destructive-soft p-2.5 text-xs text-destructive">{p.rejectReason}</p>}
                <div className="flex flex-wrap items-center gap-2 border-t bg-muted/40 p-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/property/$id" params={{ id: p.id }}>
                      <ExternalLink /> معاينة
                    </Link>
                  </Button>
                  {p.approval !== "approved" && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        approveProperty(p.id);
                        toast.success("تمت الموافقة على العقار ونشره");
                      }}
                    >
                      <Check /> موافقة
                    </Button>
                  )}
                  {p.approval !== "rejected" && (
                    <RejectDialog
                      title="رفض العقار"
                      onConfirm={(r) => {
                        rejectProperty(p.id, r);
                        toast.success("تم رفض العقار");
                      }}
                      trigger={
                        <Button size="sm" variant="outline">
                          <X /> {p.approval === "approved" ? "إيقاف النشر" : "رفض"}
                        </Button>
                      }
                    />
                  )}
                  <ConfirmDelete
                    title="حذف العقار نهائيًا؟"
                    description={`سيتم حذف «${p.title}» من المنصة.`}
                    onConfirm={() => {
                      deleteProperty(p.id);
                      toast.success("تم حذف العقار");
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Verifications ---------------- */
function VerificationsAdmin() {
  const { verifications, userById, reviewVerification } = useStore();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const list = verifications.filter((v) => v.status === filter);

  return (
    <div className="space-y-4">
      <FilterPills
        value={filter}
        onChange={setFilter}
        options={[
          ["pending", "قيد المراجعة", verifications.filter((v) => v.status === "pending").length],
          ["approved", "معتمدة", verifications.filter((v) => v.status === "approved").length],
          ["rejected", "مرفوضة", verifications.filter((v) => v.status === "rejected").length],
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={IdCard} title="لا توجد طلبات" />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((v) => {
            const u = userById(v.userId);
            return (
              <li key={v.id} className="rounded-3xl bg-card p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-primary-soft font-bold text-primary">{initials(u?.firstName, u?.lastName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold">{fullName(u)}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{u?.email}</p>
                  </div>
                  <VerificationBadge status={v.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-muted p-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">نوع الوثيقة</p>
                    <p className="font-semibold">{docTypeLabel(v.docType)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">رقم الوثيقة</p>
                    <p className="font-semibold" dir="ltr">{v.docNo}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">تاريخ التقديم</p>
                    <p className="font-semibold">{formatDate(v.submitDate)}</p>
                  </div>
                </div>
                {v.docImage ? (
                  <img src={v.docImage} alt="صورة الوثيقة" className="mt-3 aspect-[16/9] w-full rounded-2xl object-cover" />
                ) : (
                  <div className="mt-3 grid aspect-[16/9] place-items-center rounded-2xl border-2 border-dashed text-muted-foreground">
                    <div className="text-center">
                      <IdCard className="mx-auto size-10" />
                      <p className="mt-1 text-xs">صورة الوثيقة مرفقة في الملف الورقي</p>
                    </div>
                  </div>
                )}
                {v.note && <p className="mt-3 rounded-xl bg-destructive-soft p-2.5 text-xs text-destructive">{v.note}</p>}
                {v.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="success"
                      className="flex-1"
                      onClick={() => {
                        reviewVerification(v.userId, true);
                        toast.success(`تم توثيق ${fullName(u)}`);
                      }}
                    >
                      <ShieldCheck /> اعتماد
                    </Button>
                    <RejectDialog
                      title="رفض طلب التوثيق"
                      onConfirm={(r) => {
                        reviewVerification(v.userId, false, r);
                        toast.success("تم رفض طلب التوثيق");
                      }}
                      trigger={
                        <Button variant="outline" className="flex-1">
                          <X /> رفض
                        </Button>
                      }
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Users ---------------- */
function UsersAdmin() {
  const { users, properties, getVerificationStatus, toggleSuspend, deleteUser } = useStore();
  const [q, setQ] = useState("");
  const list = users
    .filter((u) => u.role !== "admin")
    .filter((u) => !q.trim() || `${u.firstName} ${u.lastName} ${u.email} ${u.phone}`.includes(q.trim()));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الجوال" className="pr-11" />
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {list.map((u) => {
          const count = properties.filter((p) => p.ownerId === u.id).length;
          return (
            <li key={u.id} className={cn("rounded-3xl bg-card p-4 shadow-soft", u.suspended && "opacity-75")}>
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarFallback className="bg-primary-soft font-bold text-primary">{initials(u.firstName, u.lastName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{fullName(u)}</p>
                  <p className="truncate text-xs text-muted-foreground" dir="ltr">{u.email} · +967 {u.phone}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <VerificationBadge status={getVerificationStatus(u.id)} />
                {u.suspended && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive-soft px-2.5 py-1 font-semibold text-destructive">
                    <Ban className="size-3.5" /> موقوف
                  </span>
                )}
                <span className="text-muted-foreground">{count} عقارات · انضم {formatDate(u.joinDate)}</span>
              </div>
              <div className="mt-3 flex gap-2 border-t pt-3">
                <Button
                  size="sm"
                  variant={u.suspended ? "success" : "outline"}
                  onClick={() => {
                    toggleSuspend(u.id);
                    toast.success(u.suspended ? "تم تفعيل الحساب" : "تم إيقاف الحساب");
                  }}
                >
                  {u.suspended ? <UserCheck /> : <Ban />}
                  {u.suspended ? "تفعيل" : "إيقاف"}
                </Button>
                <ConfirmDelete
                  label="حذف"
                  title="حذف المستخدم؟"
                  description={`سيتم حذف حساب ${fullName(u)} وجميع عقاراته ومحادثاته نهائيًا.`}
                  onConfirm={() => {
                    deleteUser(u.id);
                    toast.success("تم حذف المستخدم");
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <EmptyState icon={Users} title="لا يوجد مستخدمون مطابقون" />}
    </div>
  );
}

/* ---------------- Reports ---------------- */
function ReportsAdmin() {
  const { reports, userById, propertyById, reviews, resolveReport } = useStore();
  const [filter, setFilter] = useState<ReportStatus>("open");
  const list = reports.filter((r) => r.status === filter).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <FilterPills
        value={filter}
        onChange={setFilter}
        options={[
          ["open", "مفتوحة", reports.filter((r) => r.status === "open").length],
          ["resolved", "تمت إزالة المحتوى", reports.filter((r) => r.status === "resolved").length],
          ["dismissed", "مرفوضة", reports.filter((r) => r.status === "dismissed").length],
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={Flag} title="لا توجد بلاغات" />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((r) => {
            const reporter = userById(r.userId);
            const prop = propertyById(r.propertyId);
            const review = r.targetType === "review" ? reviews.find((x) => x.id === r.targetId) : undefined;
            return (
              <li key={r.id} className="rounded-3xl bg-card p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive-soft text-destructive">
                    <AlertTriangle className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">
                      بلاغ عن {r.targetType === "property" ? "عقار" : "تقييم"} · {timeAgo(r.date)}
                    </p>
                    <p className="font-bold">{r.reason}</p>
                    {r.details && <p className="mt-1 text-sm text-muted-foreground">{r.details}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">المُبلِّغ: {fullName(reporter)}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-muted p-3 text-sm">
                  {r.targetType === "review" ? (
                    <>
                      <p className="text-xs text-muted-foreground">نص التقييم المُبلَّغ عنه:</p>
                      <p className="mt-1">«{review?.comment ?? r.snapshot ?? "تم حذف التقييم"}»</p>
                      {prop && <p className="mt-1 text-xs text-muted-foreground">على عقار: {prop.title}</p>}
                    </>
                  ) : prop ? (
                    <div className="flex items-center gap-3">
                      <img src={imgSrc(prop.images[0])} alt="" className="size-12 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{prop.title}</p>
                        <ApprovalBadge status={prop.approval} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">العقار محذوف</p>
                  )}
                </div>
                {r.status === "open" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {prop && (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/property/$id" params={{ id: prop.id }}>
                          <ExternalLink /> عرض
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        resolveReport(r.id, "remove");
                        toast.success(r.targetType === "review" ? "تم حذف التقييم المخالف" : "تم إيقاف نشر العقار المخالف");
                      }}
                    >
                      <Trash2 /> {r.targetType === "review" ? "حذف التقييم" : "إيقاف العقار"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        resolveReport(r.id, "dismiss");
                        toast.success("تم رفض البلاغ");
                      }}
                    >
                      <Clock /> رفض البلاغ
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Shared ---------------- */
function FilterPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string, number][];
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {options.map(([k, l, n]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
            value === k ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground",
          )}
        >
          {l} ({n})
        </button>
      ))}
    </div>
  );
}

function ConfirmDelete({
  title,
  description,
  onConfirm,
  label,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  label?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 /> {label ?? "حذف"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl" className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            تأكيد الحذف
          </AlertDialogAction>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
