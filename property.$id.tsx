import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  Check,
  Eye,
  Flag,
  Home,
  MapPin,
  Maximize2,
  MessageCircle,
  Pencil,
  Phone,
  Ruler,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ApprovalBadge, Stars, StatusBadge, VerificationBadge } from "@/components/dark/Badges";
import { CompareToggle, FavoriteButton } from "@/components/dark/PropertyCard";
import { EmptyState } from "@/components/dark/EmptyState";
import { LeafletMap } from "@/components/dark/LeafletMap";
import { ReportDialog } from "@/components/dark/ReportDialog";
import { useRequireLogin } from "@/components/dark/AuthGate";
import { RejectDialog } from "@/components/dark/RejectDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { purposeLabel, typeLabel } from "@/lib/constants";
import { formatDate, formatPrice, formatYER, initials, num, timeAgo } from "@/lib/format";
import { imgSrc } from "@/lib/images";
import { averageRating, isPublic, pricePerArea, REVIEW_MAX, REVIEW_MIN } from "@/lib/rules";
import { fullName, useStore } from "@/lib/store";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/property/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل العقار | دارك" },
      {
        name: "description",
        content:
          "صور وتفاصيل وموقع العقار على الخريطة مع تقييمات الزوار والتواصل المباشر مع المالك.",
      },
      { property: "og:title", content: "تفاصيل العقار | دارك" },
      { property: "og:description", content: "تفاصيل العقار وموقعه والتواصل المباشر مع المالك." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyPage,
});

function PropertyPage() {
  const { id } = Route.useParams();
  const store = useStore();
  const { propertyById, currentUser, hydrated, incrementView } = store;
  const p = propertyById(id);
  const viewed = useRef<string | null>(null);

  const isOwner = !!currentUser && p?.ownerId === currentUser.id;
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (!hydrated || !p || viewed.current === id) return;
    viewed.current = id;
    if (!isOwner && !isAdmin && p.approval === "approved") incrementView(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, id, p?.id]);

  if (!p || (!isPublic(p) && !isOwner && !isAdmin)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={Home}
          title="العقار غير متاح"
          description="ربما حُذف هذا العقار أو لم تتم الموافقة على نشره بعد."
          action={
            <Button asChild>
              <Link to="/search">تصفح العقارات</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <PropertyDetails p={p} isOwner={isOwner} isAdmin={isAdmin} />;
}

function PropertyDetails({
  p,
  isOwner,
  isAdmin,
}: {
  p: Property;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const {
    userById,
    reviews,
    getVerificationStatus,
    startConversation,
    approveProperty,
    rejectProperty,
  } = useStore();
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();
  const owner = userById(p.ownerId);
  const propReviews = reviews.filter((r) => r.propertyId === p.id);
  const avg = averageRating(propReviews);

  const contact = () => {
    if (!requireLogin("سجّل الدخول للتواصل مع المالك")) return;
    const cid = startConversation(p.id);
    if (cid) navigate({ to: "/messages/$id", params: { id: cid } });
  };

  return (
    <div className="pb-28 md:pb-16">
      <Gallery p={p} />

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Review banners */}
        {p.approval !== "approved" && (
          <div
            className={cn(
              "mt-4 flex items-start gap-3 rounded-2xl p-4 text-sm",
              p.approval === "pending" ? "bg-warning-soft" : "bg-destructive-soft",
            )}
          >
            <ShieldAlert
              className={cn(
                "mt-0.5 size-5 shrink-0",
                p.approval === "pending" ? "text-warning" : "text-destructive",
              )}
            />
            <div className="flex-1">
              <p className="font-semibold">
                {p.approval === "pending"
                  ? "هذا العقار بانتظار مراجعة الإدارة ولا يظهر للزوار"
                  : "تم رفض نشر هذا العقار"}
              </p>
              {p.rejectReason && (
                <p className="mt-1 text-muted-foreground">السبب: {p.rejectReason}</p>
              )}
              {isAdmin && p.approval === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => {
                      approveProperty(p.id);
                      toast.success("تمت الموافقة على العقار ونشره");
                    }}
                  >
                    <Check /> موافقة ونشر
                  </Button>
                  <RejectDialog
                    title="رفض العقار"
                    onConfirm={(reason) => {
                      rejectProperty(p.id, reason);
                      toast.success("تم رفض العقار وإشعار المالك بالسبب");
                    }}
                    trigger={
                      <Button size="sm" variant="outline">
                        <X /> رفض
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-6 pt-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Title */}
            <section>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {purposeLabel(p.purpose)}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {typeLabel(p.type)}
                </span>
                <StatusBadge status={p.status} />
                {(isOwner || isAdmin) && <ApprovalBadge status={p.approval} />}
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold leading-snug md:text-3xl">
                {p.title}
              </h1>
              <p className="mt-2 flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-4" /> {p.city}، {p.district}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <p className="font-display text-3xl font-bold text-primary">
                  {formatPrice(p.price, p.purpose)}
                </p>
                {propReviews.length > 0 && (
                  <a href="#reviews" className="flex items-center gap-1.5 text-sm">
                    <Stars value={avg} /> <span className="font-semibold">{avg}</span>
                    <span className="text-muted-foreground">({propReviews.length})</span>
                  </a>
                )}
              </div>
              <div className="mt-4">
                <CompareToggle id={p.id} />
              </div>
            </section>

            {/* Facts */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Fact icon={Maximize2} label="المساحة" value={`${num(p.area)} م²`} />
              <Fact icon={BedDouble} label="الغرف" value={p.rooms ? `${p.rooms}` : "—"} />
              <Fact icon={Ruler} label="سعر المتر" value={formatYER(pricePerArea(p))} />
              <Fact icon={CalendarDays} label="تاريخ النشر" value={timeAgo(p.postDate)} />
            </section>

            <section className="rounded-3xl bg-card p-5 shadow-soft">
              <h2 className="font-display text-lg font-bold">الوصف</h2>
              <p className="mt-2 whitespace-pre-line leading-8 text-muted-foreground">
                {p.description}
              </p>
              <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3.5" /> {num(p.views)} مشاهدة
              </p>
            </section>

            {/* Map */}
            <section className="rounded-3xl bg-card p-5 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">الموقع على الخريطة</h2>
                <span className="text-sm text-muted-foreground">
                  {p.city}، {p.district}
                </span>
              </div>
              <LeafletMap lat={p.lat} lng={p.lng} className="h-72" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
              >
                <MapPin className="size-4" /> فتح الموقع في خرائط جوجل
              </a>
            </section>

            <Reviews p={p} />

            {!isOwner && (
              <ReportDialog
                targetType="property"
                targetId={p.id}
                propertyId={p.id}
                trigger={(open) => (
                  <button
                    onClick={open}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-destructive"
                  >
                    <Flag className="size-4" /> الإبلاغ عن هذا العقار
                  </button>
                )}
              />
            )}
          </div>

          {/* Owner card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl bg-card p-5 shadow-card">
              <p className="text-sm text-muted-foreground">المالك</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-primary-soft font-bold text-primary">
                    {initials(owner?.firstName, owner?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 font-bold">
                    {fullName(owner)}
                    {owner && getVerificationStatus(owner.id) === "approved" && (
                      <BadgeCheck className="size-4 text-success" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    عضو منذ {owner ? formatDate(owner.joinDate) : ""}
                  </p>
                </div>
              </div>
              {owner && (
                <div className="mt-3">
                  <VerificationBadge status={getVerificationStatus(owner.id)} />
                </div>
              )}
              {isOwner ? (
                <div className="mt-5 space-y-2">
                  <p className="rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
                    هذا العقار من إعلاناتك.
                  </p>
                  <Button asChild className="w-full" variant="outline">
                    <Link to="/owner/$id/edit" params={{ id: p.id }}>
                      <Pencil /> تعديل العقار
                    </Link>
                  </Button>
                  <Button asChild className="w-full" variant="soft">
                    <Link to="/owner">لوحة المالك</Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-5 hidden gap-2 md:grid">
                  <Button onClick={contact} size="lg">
                    <MessageCircle /> مراسلة المالك
                  </Button>
                  {owner && (
                    <Button asChild variant="outline" size="lg">
                      <a href={`tel:+967${owner.phone}`}>
                        <Phone /> <span dir="ltr">+967 {owner.phone}</span>
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile action bar */}
      {!isOwner && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-4 py-3 backdrop-blur-lg md:hidden"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{purposeLabel(p.purpose)}</p>
              <p className="truncate font-display text-lg font-bold text-primary">
                {formatPrice(p.price, p.purpose)}
              </p>
            </div>
            {owner && (
              <Button
                asChild
                variant="outline"
                size="icon"
                className="size-11"
                aria-label="اتصال بالمالك"
              >
                <a href={`tel:+967${owner.phone}`}>
                  <Phone className="size-5" />
                </a>
              </Button>
            )}
            <Button onClick={contact}>
              <MessageCircle /> مراسلة المالك
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Gallery({ p }: { p: Property }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: -i * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="relative mx-auto max-w-6xl md:px-6 md:pt-6">
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
        }}
        className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto md:aspect-[21/9] md:rounded-3xl"
      >
        {p.images.map((src, i) => (
          <img
            key={i}
            src={imgSrc(src)}
            alt={`${p.title} - صورة ${i + 1}`}
            className="size-full shrink-0 snap-center object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 md:px-10 md:pt-10">
        <button
          onClick={() => router.history.back()}
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-card/90 shadow-soft backdrop-blur"
          aria-label="رجوع"
        >
          <ArrowRight className="size-5" />
        </button>
        <FavoriteButton id={p.id} className="pointer-events-auto" />
      </div>
      {p.images.length > 1 && (
        <>
          <span className="absolute bottom-4 left-4 rounded-full bg-overlay/70 px-2.5 py-1 text-xs font-semibold text-primary-foreground md:left-10">
            {index + 1} / {p.images.length}
          </span>
          <div className="absolute bottom-4 right-1/2 flex translate-x-1/2 gap-1.5">
            {p.images.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`الصورة ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full bg-card transition-all",
                  i === index ? "w-5" : "w-1.5 opacity-60",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Maximize2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-3.5 shadow-soft">
      <Icon className="size-5 text-clay" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="font-display font-bold">{value}</p>
    </div>
  );
}

function Reviews({ p }: { p: Property }) {
  const { reviews, currentUser, userById, addReview, deleteReview } = useStore();
  const requireLogin = useRequireLogin();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const list = reviews
    .filter((r) => r.propertyId === p.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const avg = averageRating(list);
  const mine = list.find((r) => r.userId === currentUser?.id);
  const isOwner = currentUser?.id === p.ownerId;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin("سجّل الدخول لإضافة تقييم")) return;
    const res = addReview(p.id, rating, comment);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("شكرًا لك! تم نشر تقييمك");
    setRating(0);
    setComment("");
  };

  return (
    <section id="reviews" className="scroll-mt-20 rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">التقييمات والمراجعات</h2>
        {list.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold">{avg}</span>
            <div>
              <Stars value={avg} />
              <p className="text-xs text-muted-foreground">{list.length} تقييم</p>
            </div>
          </div>
        )}
      </div>

      {!isOwner && !mine && currentUser?.role !== "admin" && (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-muted p-4">
          <p className="text-sm font-semibold">أضف تقييمك</p>
          <Stars value={rating} size="lg" onChange={setRating} />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شاركنا تجربتك مع هذا العقار أو المالك..."
            maxLength={REVIEW_MAX}
            rows={3}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {comment.trim().length}/{REVIEW_MAX} · يُمنع الإساءة والروابط وأرقام الهواتف
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={!rating || comment.trim().length < REVIEW_MIN}
            >
              نشر التقييم
            </Button>
          </div>
        </form>
      )}

      <ul className="mt-4 divide-y">
        {list.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">
            لا توجد تقييمات بعد. كن أول من يقيّم!
          </li>
        )}
        {list.map((r) => {
          const u = userById(r.userId);
          const own = r.userId === currentUser?.id;
          return (
            <li key={r.id} className="py-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-clay-soft text-xs font-bold text-clay">
                    {initials(u?.firstName, u?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {fullName(u)} {own && <span className="text-xs text-primary">(تقييمك)</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-xs text-muted-foreground">{timeAgo(r.date)}</span>
                  </div>
                </div>
                {own ? (
                  <button
                    onClick={() => {
                      deleteReview(r.id);
                      toast.success("تم حذف تقييمك");
                    }}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                    aria-label="حذف التقييم"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : (
                  <ReportDialog
                    targetType="review"
                    targetId={r.id}
                    propertyId={p.id}
                    trigger={(open) => (
                      <button
                        onClick={open}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                        aria-label="الإبلاغ عن التقييم"
                      >
                        <Flag className="size-4" />
                      </button>
                    )}
                  />
                )}
              </div>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{r.comment}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
