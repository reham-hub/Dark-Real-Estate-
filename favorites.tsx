import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { AuthGate } from "@/components/dark/AuthGate";
import { EmptyState } from "@/components/dark/EmptyState";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
import { PropertyCard } from "@/components/dark/PropertyCard";
import { CompareBar } from "@/components/dark/CompareBar";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { Property } from "@/lib/types";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "المفضلة | دارك" },
      { name: "description", content: "العقارات التي حفظتها في المفضلة على دارك." },
      { property: "og:title", content: "المفضلة | دارك" },
      { property: "og:description", content: "عقاراتك المحفوظة على دارك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { favoriteIds, propertyById } = useStore();
  const items = favoriteIds.map(propertyById).filter((p): p is Property => !!p && p.approval === "approved");

  return (
    <>
      <PageHeader title="المفضلة" subtitle={items.length ? `${items.length} عقارات محفوظة` : undefined} />
      <PageBody>
        <AuthGate message="سجّل الدخول لعرض عقاراتك المفضلة">
          {items.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <PropertyCard key={p.id} property={p} showCompare />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Heart}
              title="قائمة المفضلة فارغة"
              description="اضغط على أيقونة القلب في أي عقار لحفظه هنا والرجوع إليه لاحقًا."
              action={
                <Button asChild>
                  <Link to="/search">تصفح العقارات</Link>
                </Button>
              }
            />
          )}
        </AuthGate>
      </PageBody>
      <CompareBar />
    </>
  );
}
