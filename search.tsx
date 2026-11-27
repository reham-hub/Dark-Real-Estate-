import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SearchX, SlidersHorizontal, X, Search as SearchIcon } from "lucide-react";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
import { PropertyCard } from "@/components/dark/PropertyCard";
import { CompareBar } from "@/components/dark/CompareBar";
import { EmptyState } from "@/components/dark/EmptyState";
import { Chip } from "@/components/dark/PropertyForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  MUKALLA,
  MUKALLA_DISTRICTS,
  PROPERTY_TYPES,
  PURPOSES,
  purposeLabel,
  typeLabel,
} from "@/lib/constants";
import { formatYER } from "@/lib/format";
import { filterProperties, type Filters } from "@/lib/rules";
import { useStore } from "@/lib/store";
import type { PropertyType, Purpose } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES = PROPERTY_TYPES.map((t) => t.value);

export const Route = createFileRoute("/search")({
  validateSearch: (raw: Record<string, unknown>): Filters => {
    const s = raw as {
      q?: unknown;
      city?: unknown;
      district?: unknown;
      type?: unknown;
      purpose?: unknown;
      min?: unknown;
      max?: unknown;
    };
    return {
      q: typeof s.q === "string" && s.q ? s.q : undefined,
      city: s.city === MUKALLA.name ? MUKALLA.name : undefined,
      district:
        typeof s.district === "string" && MUKALLA_DISTRICTS.some((d) => d.name === s.district)
          ? s.district
          : undefined,
      type: TYPES.includes(s.type as PropertyType) ? (s.type as PropertyType) : undefined,
      purpose: s.purpose === "sale" || s.purpose === "rent" ? s.purpose : undefined,
      min: s.min != null && !Number.isNaN(Number(s.min)) ? Number(s.min) : undefined,
      max: s.max != null && !Number.isNaN(Number(s.max)) ? Number(s.max) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "البحث عن عقار | دارك" },
      {
        name: "description",
        content: "ابحث عن عقارات المكلا وفلترها حسب الحارة والسعر والنوع وقارن بينها.",
      },
      { property: "og:title", content: "البحث عن عقار | دارك" },
      {
        property: "og:description",
        content: "عقارات المكلا وحاراتها للبيع والإيجار حسب الموقع والسعر والنوع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { properties } = useStore();
  const [q, setQ] = useState(filters.q ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => setQ(filters.q ?? ""), [filters.q]);

  const results = filterProperties(properties, filters);
  const setFilters = (f: Filters) => navigate({ search: f, replace: true });

  const active: { key: keyof Filters; label: string }[] = [];
  if (filters.district) active.push({ key: "district", label: filters.district });
  if (filters.type) active.push({ key: "type", label: typeLabel(filters.type) });
  if (filters.purpose) active.push({ key: "purpose", label: purposeLabel(filters.purpose) });
  if (filters.min != null) active.push({ key: "min", label: `من ${formatYER(filters.min)}` });
  if (filters.max != null) active.push({ key: "max", label: `إلى ${formatYER(filters.max)}` });

  return (
    <>
      <PageHeader title="البحث عن عقار" subtitle={`${results.length} نتيجة`} />
      <PageBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilters({ ...filters, q: q.trim() || undefined });
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن حارة أو نوع عقار في المكلا..."
              className="pr-11"
              aria-label="كلمات البحث"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="relative size-11"
            onClick={() => setOpen(true)}
            aria-label="الفلاتر"
          >
            <SlidersHorizontal className="size-5" />
            {active.length > 0 && (
              <span className="absolute -left-1 -top-1 grid size-5 place-items-center rounded-full bg-clay text-[10px] font-bold text-clay-foreground">
                {active.length}
              </span>
            )}
          </Button>
        </form>

        {/* Quick purpose toggle */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          <QuickChip
            active={!filters.purpose}
            onClick={() => setFilters({ ...filters, purpose: undefined })}
          >
            الكل
          </QuickChip>
          {PURPOSES.map((p) => (
            <QuickChip
              key={p.value}
              active={filters.purpose === p.value}
              onClick={() => setFilters({ ...filters, purpose: p.value })}
            >
              {p.label}
            </QuickChip>
          ))}
          {active
            .filter((a) => a.key !== "purpose")
            .map((a) => (
              <button
                key={a.key}
                onClick={() => setFilters({ ...filters, [a.key]: undefined })}
                className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-medium text-accent-foreground"
              >
                {a.label} <X className="size-3.5" />
              </button>
            ))}
          {filters.q && (
            <button
              onClick={() => setFilters({ ...filters, q: undefined })}
              className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-medium text-accent-foreground"
            >
              «{filters.q}» <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="mt-5">
          {results.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <PropertyCard key={p.id} property={p} showCompare />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchX}
              title="لا توجد نتائج مطابقة"
              description="جرّب تعديل كلمات البحث أو إزالة بعض الفلاتر."
              action={
                <Button variant="outline" onClick={() => setFilters({})}>
                  مسح جميع الفلاتر
                </Button>
              }
            />
          )}
        </div>
      </PageBody>

      <FilterSheet
        open={open}
        onOpenChange={setOpen}
        value={filters}
        onApply={(f) => setFilters({ ...f, q: filters.q })}
      />
      <CompareBar />
    </>
  );
}

function QuickChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition",
        active ? "bg-foreground text-background" : "bg-card text-muted-foreground shadow-soft",
      )}
    >
      {children}
    </button>
  );
}

function FilterSheet({
  open,
  onOpenChange,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: Filters;
  onApply: (f: Filters) => void;
}) {
  const [district, setDistrict] = useState<string | undefined>();
  const [type, setType] = useState<PropertyType | undefined>();
  const [purpose, setPurpose] = useState<Purpose | undefined>();
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  useEffect(() => {
    if (!open) return;
    setDistrict(value.district);
    setType(value.type);
    setPurpose(value.purpose);
    setMin(value.min?.toString() ?? "");
    setMax(value.max?.toString() ?? "");
  }, [open, value]);

  const apply = () => {
    const mn = min ? Number(min) : undefined;
    const mx = max ? Number(max) : undefined;
    onApply({
      district,
      type,
      purpose,
      min: mn != null && mx != null && mn > mx ? mx : mn,
      max: mn != null && mx != null && mn > mx ? mn : mx,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl" dir="rtl">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">تصفية النتائج</SheetTitle>
        </SheetHeader>
        <div className="mx-auto max-w-2xl space-y-6 py-5">
          <div className="space-y-2">
            <Label className="font-semibold">حارات المكلا</Label>
            <div className="flex flex-wrap gap-2">
              <Chip active={!district} onClick={() => setDistrict(undefined)}>
                كل الحارات
              </Chip>
              {MUKALLA_DISTRICTS.map((c) => (
                <Chip key={c.name} active={district === c.name} onClick={() => setDistrict(c.name)}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">نوع العقار</Label>
            <div className="flex flex-wrap gap-2">
              <Chip active={!type} onClick={() => setType(undefined)}>
                الكل
              </Chip>
              {PROPERTY_TYPES.map((t) => (
                <Chip key={t.value} active={type === t.value} onClick={() => setType(t.value)}>
                  {t.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">نوع العرض</Label>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1">
              {[{ value: undefined, label: "الكل" }, ...PURPOSES].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPurpose(p.value as Purpose | undefined)}
                  className={cn(
                    "rounded-lg py-2 text-sm font-semibold transition",
                    purpose === p.value
                      ? "bg-card text-primary shadow-soft"
                      : "text-muted-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">نطاق السعر (ريال يمني)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="الحد الأدنى"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="الحد الأعلى"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { l: "أقل من ١٥٠ ألف", mn: "", mx: "150000" },
                { l: "١٥٠ – ٣٠٠ ألف", mn: "150000", mx: "300000" },
                { l: "أقل من ٥٠ مليون", mn: "", mx: "50000000" },
                { l: "٥٠ – ١٥٠ مليون", mn: "50000000", mx: "150000000" },
                { l: "أكثر من ١٥٠ مليون", mn: "150000000", mx: "" },
              ].map((r) => (
                <button
                  key={r.l}
                  type="button"
                  onClick={() => {
                    setMin(r.mn);
                    setMax(r.mx);
                  }}
                  className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {r.l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <SheetFooter className="mx-auto w-full max-w-2xl flex-row gap-2 border-t pt-4">
          <Button className="flex-1" onClick={apply}>
            عرض النتائج
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setDistrict(undefined);
              setType(undefined);
              setPurpose(undefined);
              setMin("");
              setMax("");
            }}
          >
            إعادة تعيين
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
