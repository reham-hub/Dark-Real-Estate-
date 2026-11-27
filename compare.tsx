import { createFileRoute, Link } from "@tanstack/react-router";
import { GitCompareArrows, Trophy, X } from "lucide-react";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
import { EmptyState } from "@/components/dark/EmptyState";
import { Stars, StatusBadge } from "@/components/dark/Badges";
import { Button } from "@/components/ui/button";
import { purposeLabel, typeLabel } from "@/lib/constants";
import { formatPrice, formatYER, num } from "@/lib/format";
import { imgSrc } from "@/lib/images";
import { averageRating, pricePerArea } from "@/lib/rules";
import { useStore } from "@/lib/store";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "مقارنة العقارات | دارك" },
      { name: "description", content: "قارن بين العقارات جنبًا إلى جنب: السعر، المساحة، سعر المتر والغرف." },
      { property: "og:title", content: "مقارنة العقارات | دارك" },
      { property: "og:description", content: "مقارنة العقارات جنبًا إلى جنب على دارك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComparePage,
});

type Row = {
  label: string;
  render: (p: Property) => React.ReactNode;
  best?: "min" | "max";
  value?: (p: Property) => number;
};

function ComparePage() {
  const { compare, propertyById, toggleCompare, clearCompare, reviews } = useStore();
  const items = compare.map(propertyById).filter((p): p is Property => !!p);

  const rating = (p: Property) => averageRating(reviews.filter((r) => r.propertyId === p.id));

  const rows: Row[] = [
    { label: "السعر", render: (p) => formatPrice(p.price, p.purpose), best: "min", value: (p) => p.price },
    { label: "المساحة", render: (p) => `${num(p.area)} م²`, best: "max", value: (p) => p.area },
    { label: "سعر المتر", render: (p) => formatYER(pricePerArea(p)), best: "min", value: pricePerArea },
    { label: "الغرف", render: (p) => (p.rooms ? p.rooms : "—"), best: "max", value: (p) => p.rooms },
    { label: "النوع", render: (p) => typeLabel(p.type) },
    { label: "العرض", render: (p) => purposeLabel(p.purpose) },
    { label: "المدينة", render: (p) => p.city },
    { label: "الحي", render: (p) => p.district },
    { label: "الحالة", render: (p) => <StatusBadge status={p.status} /> },
    {
      label: "التقييم",
      render: (p) => (rating(p) ? <Stars value={rating(p)} /> : <span className="text-muted-foreground">—</span>),
      best: "max",
      value: rating,
    },
  ];

  // "Best" only makes sense when all compared items share a purpose (sale vs rent prices differ).
  const samePurpose = new Set(items.map((p) => p.purpose)).size === 1;

  return (
    <>
      <PageHeader
        back
        title="مقارنة العقارات"
        subtitle={items.length ? `${items.length} عقارات` : undefined}
        actions={
          items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCompare}>
              مسح الكل
            </Button>
          )
        }
      />
      <PageBody>
        {items.length < 2 ? (
          <EmptyState
            icon={GitCompareArrows}
            title={items.length ? "أضف عقارًا آخر للمقارنة" : "لا توجد عقارات للمقارنة"}
            description="اضغط على زر «قارن» في بطاقات العقارات لإضافة حتى 3 عقارات."
            action={
              <Button asChild>
                <Link to="/search">تصفح العقارات</Link>
              </Button>
            }
          />
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <table style={{ minWidth: 96 + items.length * 160 }} className="w-full border-separate border-spacing-0 overflow-hidden rounded-3xl bg-card shadow-card">
              <thead>
                <tr>
                  <th className="sticky right-0 w-24 bg-card p-3" />
                  {items.map((p) => (
                    <th key={p.id} className="p-3 align-top">
                      <div className="relative">
                        <Link to="/property/$id" params={{ id: p.id }}>
                          <img src={imgSrc(p.images[0])} alt={p.title} className="aspect-[4/3] w-full rounded-2xl object-cover" />
                          <p className="mt-2 line-clamp-2 text-right text-sm font-bold">{p.title}</p>
                        </Link>
                        <button
                          onClick={() => toggleCompare(p.id)}
                          className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-card/90 shadow-soft"
                          aria-label="إزالة من المقارنة"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  let bestVal: number | undefined;
                  if (row.best && row.value && (samePurpose || row.label !== "السعر") && (samePurpose || row.label !== "سعر المتر")) {
                    const vals = items.map(row.value).filter((v) => v > 0);
                    if (vals.length > 1 && new Set(vals).size > 1)
                      bestVal = row.best === "min" ? Math.min(...vals) : Math.max(...vals);
                  }
                  return (
                    <tr key={row.label} className={ri % 2 ? "" : "bg-muted/60"}>
                      <td className={cn("sticky right-0 p-3 text-sm font-semibold text-muted-foreground", ri % 2 ? "bg-card" : "bg-muted")}>
                        {row.label}
                      </td>
                      {items.map((p) => {
                        const isBest = bestVal != null && row.value?.(p) === bestVal;
                        return (
                          <td key={p.id} className={cn("p-3 text-sm font-medium", isBest && "text-success")}>
                            <span className="inline-flex items-center gap-1">
                              {row.render(p)}
                              {isBest && <Trophy className="size-3.5" />}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="size-3.5 text-success" /> يشير إلى الأفضل في كل بند
            </p>
          </div>
        )}
      </PageBody>
    </>
  );
}
