import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  ExternalLink,
  MessageCircle,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/dark/AuthGate";
import { ApprovalBadge } from "@/components/dark/Badges";
import { EmptyState } from "@/components/dark/EmptyState";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES } from "@/lib/constants";
import { formatPrice, num, timeAgo } from "@/lib/format";
import { imgSrc } from "@/lib/images";
import { canPostProperty } from "@/lib/rules";
import { useStore } from "@/lib/store";
import type { ApprovalStatus, PropertyStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/owner/")({
  head: () => ({
    meta: [
      { title: "لوحة المالك | دارك" },
      { name: "description", content: "إدارة ومتابعة عقاراتك وإعلاناتك على دارك." },
      { property: "og:title", content: "لوحة المالك | دارك" },
      { property: "og:description", content: "إدارة ومتابعة العقارات والإعلانات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OwnerDashboard,
});

type Tab = "all" | ApprovalStatus;

function OwnerDashboard() {
  return (
    <>
      <PageHeader
        title="لوحة المالك"
        subtitle="إدارة ومتابعة عقاراتك"
        actions={
          <Button asChild size="sm">
            <Link to="/owner/new">
              <Plus /> إضافة
            </Link>
          </Button>
        }
      />
      <PageBody>
        <AuthGate message="سجّل الدخول لإدارة عقاراتك">
          <Dashboard />
        </AuthGate>
      </PageBody>
    </>
  );
}

function Dashboard() {
  const { currentUser, properties, conversations, getVerificationStatus, setPropertyStatus, deleteProperty } = useStore();
  const [tab, setTab] = useState<Tab>("all");
  const me = currentUser!;
  const mine = properties.filter((p) => p.ownerId === me.id);
  const ver = getVerificationStatus(me.id);
  const myConvs = conversations.filter((c) => c.ownerId === me.id);
  const totalViews = mine.reduce((s, p) => s + p.views, 0);
  const list = tab === "all" ? mine : mine.filter((p) => p.approval === tab);
  const maxViews = Math.max(1, ...mine.map((p) => p.views));

  if (me.role === "admin")
    return (
      <EmptyState
        icon={ShieldAlert}
        title="هذه اللوحة مخصصة للملاك"
        action={
          <Button asChild>
            <Link to="/admin" search={{ tab: "overview" }}>
              لوحة الإدارة
            </Link>
          </Button>
        }
      />
    );

  const stats = [
    { label: "إجمالي العقارات", value: mine.length, icon: Building2, cls: "bg-primary-soft text-primary" },
    { label: "منشورة", value: mine.filter((p) => p.approval === "approved").length, icon: CheckCircle2, cls: "bg-success-soft text-success" },
    { label: "قيد المراجعة", value: mine.filter((p) => p.approval === "pending").length, icon: Clock, cls: "bg-warning-soft text-warning" },
    { label: "المشاهدات", value: totalViews, icon: Eye, cls: "bg-clay-soft text-clay" },
    { label: "المحادثات", value: myConvs.length, icon: MessageCircle, cls: "bg-secondary text-secondary-foreground" },
    { label: "مرفوضة", value: mine.filter((p) => p.approval === "rejected").length, icon: XCircle, cls: "bg-destructive-soft text-destructive" },
  ];

  return (
    <div className="space-y-6">
      {!canPostProperty(ver) && (
        <Link to="/verify" className="flex items-center gap-3 rounded-3xl bg-clay-soft p-4">
          <ShieldAlert className="size-6 shrink-0 text-clay" />
          <div className="flex-1 text-sm">
            <p className="font-bold">{ver === "pending" ? "توثيق هويتك قيد المراجعة" : "وثّق هويتك لتتمكن من نشر العقارات"}</p>
            <p className="text-muted-foreground">لا يمكن إضافة عقارات قبل اعتماد التوثيق من الإدارة.</p>
          </div>
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 shadow-soft">
            <span className={cn("grid size-9 place-items-center rounded-xl", s.cls)}>
              <s.icon className="size-4" />
            </span>
            <p className="mt-3 font-display text-2xl font-bold">{num(s.value)}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      {mine.some((p) => p.approval === "approved") && (
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold">متابعة المشاهدات</h2>
          <ul className="mt-4 space-y-3">
            {mine
              .filter((p) => p.approval === "approved")
              .sort((a, b) => b.views - a.views)
              .map((p) => (
                <li key={p.id} className="text-sm">
                  <div className="mb-1 flex justify-between gap-2">
                    <span className="truncate">{p.title}</span>
                    <span className="shrink-0 font-semibold">{num(p.views)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(p.views / maxViews) * 100}%` }} />
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {(
            [
              ["all", "الكل"],
              ["approved", "منشورة"],
              ["pending", "قيد المراجعة"],
              ["rejected", "مرفوضة"],
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition",
                tab === k ? "bg-foreground text-background" : "bg-card text-muted-foreground shadow-soft",
              )}
            >
              {l} ({k === "all" ? mine.length : mine.filter((p) => p.approval === k).length})
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="لا توجد عقارات هنا"
            description="أضف عقارك الأول وسيظهر للزوار بعد موافقة الإدارة."
            action={
              <Button asChild>
                <Link to="/owner/new">
                  <Plus /> إضافة عقار
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {list.map((p) => {
              const convCount = myConvs.filter((c) => c.propertyId === p.id).length;
              return (
                <li key={p.id} className="overflow-hidden rounded-3xl bg-card shadow-soft">
                  <div className="flex gap-3 p-3">
                    <img src={imgSrc(p.images[0])} alt={p.title} className="size-24 shrink-0 rounded-2xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1">
                        <ApprovalBadge status={p.approval} />
                      </div>
                      <h3 className="line-clamp-2 text-sm font-bold">{p.title}</h3>
                      <p className="mt-1 text-sm font-bold text-primary">{formatPrice(p.price, p.purpose)}</p>
                      <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="size-3.5" /> {num(p.views)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="size-3.5" /> {convCount}</span>
                        <span>{timeAgo(p.postDate)}</span>
                      </p>
                    </div>
                  </div>
                  {p.approval === "rejected" && p.rejectReason && (
                    <p className="mx-3 mb-3 rounded-xl bg-destructive-soft p-2.5 text-xs text-destructive">سبب الرفض: {p.rejectReason}</p>
                  )}
                  <div className="flex items-center gap-2 border-t bg-muted/40 p-3">
                    <Select
                      value={p.status}
                      onValueChange={(v) => {
                        setPropertyStatus(p.id, v as PropertyStatus);
                        toast.success("تم تحديث حالة العقار");
                      }}
                      dir="rtl"
                    >
                      <SelectTrigger className="h-9 flex-1 rounded-lg text-xs" aria-label="حالة العقار">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button asChild variant="ghost" size="icon" className="size-9" aria-label="عرض">
                      <Link to="/property/$id" params={{ id: p.id }}>
                        <ExternalLink />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="size-9" aria-label="تعديل">
                      <Link to="/owner/$id/edit" params={{ id: p.id }}>
                        <Pencil />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-9 text-destructive hover:text-destructive" aria-label="حذف">
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl" className="rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف العقار؟</AlertDialogTitle>
                          <AlertDialogDescription>سيتم حذف «{p.title}» وصوره وتقييماته نهائيًا ولا يمكن التراجع.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                              deleteProperty(p.id);
                              toast.success("تم حذف العقار");
                            }}
                          >
                            حذف
                          </AlertDialogAction>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
