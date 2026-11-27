import { Link } from "@tanstack/react-router";
import { BedDouble, GitCompareArrows, Heart, MapPin, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { typeLabel, purposeLabel } from "@/lib/constants";
import { formatPrice, num } from "@/lib/format";
import { imgSrc } from "@/lib/images";
import { useStore } from "@/lib/store";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./Badges";
import { useRequireLogin } from "./AuthGate";

export function FavoriteButton({ id, className }: { id: string; className?: string }) {
  const { favoriteIds, toggleFavorite } = useStore();
  const requireLogin = useRequireLogin();
  const active = favoriteIds.includes(id);
  return (
    <button
      type="button"
      aria-label={active ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!requireLogin("سجّل الدخول لحفظ العقارات في المفضلة")) return;
        const added = toggleFavorite(id);
        toast.success(added ? "أُضيف العقار إلى المفضلة" : "أُزيل العقار من المفضلة");
      }}
      className={cn(
        "grid size-10 place-items-center rounded-full bg-card/90 shadow-soft backdrop-blur transition active:scale-90",
        className,
      )}
    >
      <Heart className={cn("size-5", active ? "fill-clay text-clay" : "text-foreground")} />
    </button>
  );
}

export function CompareToggle({ id, compact = false }: { id: string; compact?: boolean }) {
  const { compare, toggleCompare } = useStore();
  const active = compare.includes(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const err = toggleCompare(id);
        if (err) toast.error(err);
      }}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      <GitCompareArrows className="size-3.5" />
      {compact ? (active ? "مُضاف" : "قارن") : active ? "في المقارنة" : "أضف للمقارنة"}
    </button>
  );
}

export function PropertyCard({
  property: p,
  variant = "grid",
  showCompare = false,
}: {
  property: Property;
  variant?: "grid" | "row";
  showCompare?: boolean;
}) {
  if (variant === "row") {
    return (
      <Link
        to="/property/$id"
        params={{ id: p.id }}
        className="flex gap-3 rounded-2xl bg-card p-2.5 shadow-soft transition hover:shadow-card"
      >
        <div className="relative size-28 shrink-0 overflow-hidden rounded-xl">
          <img src={imgSrc(p.images[0])} alt={p.title} loading="lazy" className="size-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug">{p.title}</h3>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {p.city}، {p.district}
          </p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <span className="font-display text-base font-bold text-primary">{formatPrice(p.price, p.purpose)}</span>
            <StatusBadge status={p.status} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/property/$id"
      params={{ id: p.id }}
      className="group block overflow-hidden rounded-3xl bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imgSrc(p.images[0])}
          alt={p.title}
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              {purposeLabel(p.purpose)}
            </span>
            {p.status !== "available" && <StatusBadge status={p.status} />}
          </div>
          <FavoriteButton id={p.id} />
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
          {typeLabel(p.type)}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <p className="font-display text-lg font-bold text-primary">{formatPrice(p.price, p.purpose)}</p>
        <h3 className="line-clamp-1 font-bold">{p.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4" /> {p.city}، {p.district}
        </p>
        <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Maximize2 className="size-3.5" /> {num(p.area)} م²
            </span>
            {p.rooms > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble className="size-3.5" /> {p.rooms} غرف
              </span>
            )}
          </div>
          {showCompare && <CompareToggle id={p.id} compact />}
        </div>
      </div>
    </Link>
  );
}
