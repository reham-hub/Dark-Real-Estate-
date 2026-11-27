import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Purpose } from "./types";

export const num = (n: number) => n.toLocaleString("en-US");

/** Yemeni rial. Millions are shortened ("200 مليون ر.ي") to stay readable on mobile. */
export function formatYER(amount: number) {
  if (amount >= 1_000_000) {
    const m = Math.round((amount / 1_000_000) * 10) / 10;
    return `${num(m)} مليون ر.ي`;
  }
  return `${num(amount)} ر.ي`;
}

export function formatPrice(price: number, purpose?: Purpose) {
  return `${formatYER(price)}${purpose === "rent" ? " / شهريًا" : ""}`;
}

export function timeAgo(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { locale: ar, addSuffix: true });
  } catch {
    return "";
  }
}

export function formatDate(date: string) {
  try {
    return format(new Date(date), "d MMMM yyyy", { locale: ar });
  } catch {
    return date;
  }
}

export function formatTime(date: string) {
  try {
    return format(new Date(date), "h:mm a", { locale: ar });
  } catch {
    return "";
  }
}

export const initials = (first?: string, last?: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`;
