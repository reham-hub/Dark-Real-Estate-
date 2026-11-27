import type { DocType, PropertyStatus, PropertyType, Purpose } from "./types";

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "شقة" },
  { value: "villa", label: "فيلا" },
  { value: "house", label: "بيت شعبي" },
  { value: "building", label: "عمارة" },
  { value: "land", label: "أرض" },
  { value: "shop", label: "محل تجاري" },
  { value: "office", label: "مكتب" },
];

export const PURPOSES: { value: Purpose; label: string }[] = [
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
];

export const STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: "available", label: "متاح" },
  { value: "unavailable", label: "غير متاح" },
  { value: "sold", label: "تم البيع" },
  { value: "rented", label: "تم التأجير" },
];

export const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "national_id", label: "البطاقة الشخصية" },
  { value: "passport", label: "جواز السفر" },
];

export const MUKALLA = { name: "المكلا", lat: 14.5425, lng: 49.1242 };
export const CITIES = [MUKALLA];

// Neighborhood centers are approximate demo pin positions, not property addresses.
export const MUKALLA_DISTRICTS = [
  { name: "الشرج", lat: 14.5351, lng: 49.1249 },
  { name: "الديس", lat: 14.5562, lng: 49.1315 },
  { name: "خلف", lat: 14.5352, lng: 49.1471 },
  { name: "حي السلام", lat: 14.5358, lng: 49.1295 },
  { name: "المكلا القديمة", lat: 14.5316, lng: 49.1342 },
  { name: "فوة", lat: 14.4864, lng: 49.041 },
  { name: "فوة القديمة", lat: 14.4902, lng: 49.044 },
  { name: "ابن سيناء", lat: 14.5028, lng: 49.0508 },
  { name: "المتضررين", lat: 14.5098, lng: 49.0588 },
  { name: "بويش", lat: 14.5868, lng: 49.2036 },
  { name: "روكب", lat: 14.5797, lng: 49.2111 },
  { name: "العيص", lat: 14.586, lng: 49.189 },
  { name: "الحرشيات", lat: 14.569, lng: 49.113 },
  { name: "الغويزي", lat: 14.574, lng: 49.132 },
];

export const REPORT_REASONS = [
  "معلومات مضللة أو غير صحيحة",
  "عقار وهمي أو احتيال",
  "صور غير لائقة أو لا تخص العقار",
  "محتوى مسيء أو ألفاظ غير لائقة",
  "إعلان مكرر",
  "سبب آخر",
];

export const typeLabel = (t: PropertyType) => PROPERTY_TYPES.find((x) => x.value === t)?.label ?? t;
export const purposeLabel = (p: Purpose) => PURPOSES.find((x) => x.value === p)?.label ?? p;
export const statusLabel = (s: PropertyStatus) => STATUSES.find((x) => x.value === s)?.label ?? s;
export const docTypeLabel = (d: DocType) => DOC_TYPES.find((x) => x.value === d)?.label ?? d;
