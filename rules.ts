import type { Property, PropertyType, Purpose, Review, User, VerificationStatus } from "./types";
import { MUKALLA, MUKALLA_DISTRICTS } from "./constants";

export function isServiceLocation(city: string, district: string): boolean {
  return city === MUKALLA.name && MUKALLA_DISTRICTS.some((d) => d.name === district);
}

/* ---------- Comparison ---------- */
export const MAX_COMPARE = 3;

export function toggleCompareList(list: string[], id: string): { list: string[]; error?: string } {
  if (list.includes(id)) return { list: list.filter((x) => x !== id) };
  if (list.length >= MAX_COMPARE)
    return { list, error: `يمكنك مقارنة ${MAX_COMPARE} عقارات كحد أقصى` };
  return { list: [...list, id] };
}

export function pricePerArea(p: Pick<Property, "price" | "area">): number {
  if (!p.area) return 0;
  return Math.round(p.price / p.area);
}

/* ---------- Search & filters ---------- */
export interface Filters {
  q?: string | undefined;
  city?: string | undefined;
  district?: string | undefined;
  type?: PropertyType | undefined;
  purpose?: Purpose | undefined;
  min?: number | undefined;
  max?: number | undefined;
}

/** Publicly listed properties: approved by the administration only. */
export function isPublic(p: Property) {
  return p.approval === "approved" && isServiceLocation(p.city, p.district);
}

export function filterProperties(list: Property[], f: Filters): Property[] {
  const q = f.q?.trim().toLowerCase();
  return list.filter((p) => {
    if (!isPublic(p)) return false;
    if (q) {
      const hay = `${p.title} ${p.description} ${p.city} ${p.district}`.toLowerCase();
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    if (f.city && p.city !== f.city) return false;
    if (f.district && p.district !== f.district) return false;
    if (f.type && p.type !== f.type) return false;
    if (f.purpose && p.purpose !== f.purpose) return false;
    if (f.min != null && p.price < f.min) return false;
    if (f.max != null && p.price > f.max) return false;
    return true;
  });
}

/* ---------- Owner verification ---------- */
export function canPostProperty(verification: VerificationStatus) {
  return verification === "approved";
}

/* ---------- Reviews policy ---------- */
export const REVIEW_MIN = 10;
export const REVIEW_MAX = 500;
const BANNED_WORDS = ["نصاب", "حرامي", "كذاب", "غبي", "احتيال"];

export function validateReview(input: {
  user: User | null;
  property: Property;
  rating: number;
  comment: string;
  existing: Review[];
}): string | null {
  const { user, property, rating, comment, existing } = input;
  if (!user) return "يجب تسجيل الدخول لإضافة تقييم";
  if (user.id === property.ownerId) return "لا يمكنك تقييم عقارك الخاص";
  if (existing.some((r) => r.userId === user.id && r.propertyId === property.id))
    return "لقد قمت بتقييم هذا العقار مسبقًا";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return "اختر تقييمًا من 1 إلى 5 نجوم";
  const text = comment.trim();
  if (text.length < REVIEW_MIN) return `يجب ألا يقل التعليق عن ${REVIEW_MIN} أحرف`;
  if (text.length > REVIEW_MAX) return `يجب ألا يزيد التعليق عن ${REVIEW_MAX} حرف`;
  if (BANNED_WORDS.some((w) => text.includes(w)))
    return "يحتوي التعليق على ألفاظ مخالفة لسياسة المنصة";
  if (/(https?:\/\/|www\.)/i.test(text) || /\d{9,}/.test(text))
    return "لا يُسمح بإضافة روابط أو أرقام هواتف في التقييمات";
  return null;
}

export function averageRating(reviews: Review[]): number {
  if (!reviews.length) return 0;
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
}
