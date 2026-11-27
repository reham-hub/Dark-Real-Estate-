import { BadgeCheck, Clock, Star, XCircle } from "lucide-react";
import { statusLabel } from "@/lib/constants";
import type { ApprovalStatus, PropertyStatus, VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const pill = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold";

export function StatusBadge({ status, className }: { status: PropertyStatus; className?: string }) {
  const tone =
    status === "available"
      ? "bg-success-soft text-success"
      : status === "unavailable"
        ? "bg-muted text-muted-foreground"
        : "bg-clay-soft text-clay";
  return <span className={cn(pill, tone, className)}>{statusLabel(status)}</span>;
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  if (status === "approved")
    return (
      <span className={cn(pill, "bg-success-soft text-success")}>
        <BadgeCheck className="size-3.5" /> منشور
      </span>
    );
  if (status === "pending")
    return (
      <span className={cn(pill, "bg-warning-soft text-warning")}>
        <Clock className="size-3.5" /> قيد المراجعة
      </span>
    );
  return (
    <span className={cn(pill, "bg-destructive-soft text-destructive")}>
      <XCircle className="size-3.5" /> مرفوض
    </span>
  );
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const map = {
    approved: { cls: "bg-success-soft text-success", label: "موثّق", Icon: BadgeCheck },
    pending: { cls: "bg-warning-soft text-warning", label: "التوثيق قيد المراجعة", Icon: Clock },
    rejected: { cls: "bg-destructive-soft text-destructive", label: "التوثيق مرفوض", Icon: XCircle },
    none: { cls: "bg-muted text-muted-foreground", label: "غير موثّق", Icon: Clock },
  }[status];
  return (
    <span className={cn(pill, map.cls)}>
      <map.Icon className="size-3.5" /> {map.label}
    </span>
  );
}

export function Stars({
  value,
  size = "sm",
  onChange,
}: {
  value: number;
  size?: "sm" | "lg";
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const icon = (
          <Star
            className={cn(
              size === "lg" ? "size-8" : "size-4",
              filled ? "fill-gold text-gold" : "fill-muted text-border",
            )}
          />
        );
        return onChange ? (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className="p-0.5 transition-transform active:scale-90"
            aria-label={`${i} نجوم`}
          >
            {icon}
          </button>
        ) : (
          <span key={i}>{icon}</span>
        );
      })}
    </div>
  );
}
