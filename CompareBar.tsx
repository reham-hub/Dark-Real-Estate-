import { Link } from "@tanstack/react-router";
import { GitCompareArrows, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { imgSrc } from "@/lib/images";
import { MAX_COMPARE } from "@/lib/rules";
import { useStore } from "@/lib/store";

export function CompareBar() {
  const { compare, propertyById, toggleCompare, clearCompare } = useStore();
  if (!compare.length) return null;
  const items = compare.map(propertyById).filter(Boolean);

  return (
    <div className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg animate-in slide-in-from-bottom-4 md:bottom-6">
      <div className="flex items-center gap-3 rounded-2xl bg-overlay p-2.5 text-primary-foreground shadow-float">
        <div className="flex -space-x-2 space-x-reverse">
          {items.map((p) => (
            <button
              key={p!.id}
              onClick={() => toggleCompare(p!.id)}
              className="group relative size-11 overflow-hidden rounded-xl ring-2 ring-overlay"
              aria-label={`إزالة ${p!.title} من المقارنة`}
            >
              <img src={imgSrc(p!.images[0])} alt="" className="size-full object-cover" />
              <span className="absolute inset-0 hidden place-items-center bg-overlay/70 group-hover:grid">
                <X className="size-4" />
              </span>
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">المقارنة</p>
          <p className="text-xs opacity-70">
            {compare.length} من {MAX_COMPARE} عقارات
          </p>
        </div>
        <button onClick={clearCompare} className="px-2 text-xs opacity-70 hover:opacity-100">
          مسح
        </button>
        <Button asChild variant="clay" size="sm" disabled={compare.length < 2}>
          <Link to="/compare">
            <GitCompareArrows /> قارن
          </Link>
        </Button>
      </div>
    </div>
  );
}
