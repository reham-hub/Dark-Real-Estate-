import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Briefcase,
  Building,
  Building2,
  ChevronLeft,
  Home,
  LandPlot,
  Plus,
  Search,
  ShieldCheck,
  Store,
  Warehouse,
} from "lucide-react";
import { Logo } from "@/components/dark/Logo";
import { PropertyCard } from "@/components/dark/PropertyCard";
import { CompareBar } from "@/components/dark/CompareBar";
import { Button } from "@/components/ui/button";
import { MUKALLA_DISTRICTS, PROPERTY_TYPES } from "@/lib/constants";
import { isPublic } from "@/lib/rules";
import { useStore } from "@/lib/store";
import type { PropertyType } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "دارك | عقارات المكلا" },
      {
        name: "description",
        content: "تصفح عقارات للبيع والإيجار في المكلا وحاراتها وتواصل مع المالك مباشرة.",
      },
      { property: "og:title", content: "دارك | عقارات المكلا" },
      {
        property: "og:description",
        content: "عقارات المكلا وحاراتها، مباشرة من المالك دون وسطاء.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const TYPE_ICONS: Record<PropertyType, typeof Home> = {
  apartment: Building2,
  villa: Home,
  house: Warehouse,
  building: Building,
  land: LandPlot,
  shop: Store,
  office: Briefcase,
};

function HomePage() {
  const { properties, currentUser } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const listed = properties.filter(isPublic);
  const featured = [...listed]
    .filter((p) => p.status === "available")
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);
  const latest = [...listed].sort((a, b) => b.postDate.localeCompare(a.postDate)).slice(0, 6);

  return (
    <div className="pb-safe-nav md:pb-16">
      {/* Hero */}
      <section className="relative border-b bg-hero-classic text-foreground">
        <div className="mx-auto flex max-w-6xl flex-col px-4 pb-10 pt-5 md:px-6 md:py-16">
          <div className="flex items-center justify-between md:hidden">
            <Logo />
            <Button asChild variant="outline" size="sm">
              <Link
              to={currentUser ? "/account" : "/login"}
            >
              {currentUser ? currentUser.firstName : "تسجيل الدخول"}
              </Link>
            </Button>
          </div>

          <div className="mx-auto mt-10 w-full max-w-2xl md:mt-0">
            <span className="block h-0.5 w-10 rounded-full bg-gold-soft" aria-hidden />
            <h1 className="mt-4 font-display text-3xl font-semibold leading-relaxed md:text-4xl">
              عقارات المكلا
            </h1>
            <p className="mt-3 text-balance text-base leading-relaxed text-muted-foreground md:text-lg">
              اكتشف عقارات للبيع والإيجار في المكلا، مباشرة من المالك.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/search", search: { q: q.trim() || undefined } });
              }}
              className="mt-7 flex items-center gap-2 rounded-full border bg-card p-1.5 text-card-foreground shadow-soft"
            >
              <Search className="mr-3 size-5 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="الحارة أو نوع العقار في المكلا"
                className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:h-12"
                aria-label="بحث عن عقار"
              />
              <Button type="submit" className="h-11 rounded-full px-6 md:h-12 md:px-8">
                بحث
              </Button>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-9 px-4 pt-8 md:px-6 md:pt-10">
        {/* Types */}
        <section>
          <SectionTitle title="تصفّح حسب النوع" />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-7 md:px-0">
            {PROPERTY_TYPES.map((t) => {
              const Icon = TYPE_ICONS[t.value];
              return (
                <Link
                  key={t.value}
                  to="/search"
                  search={{ type: t.value }}
                  className="flex w-20 shrink-0 flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-soft transition hover:shadow-card md:w-auto"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured */}
        <section>
          <SectionTitle title="الأكثر مشاهدة" link={{ to: "/search", label: "عرض الكل" }} />
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0">
            {featured.map((p) => (
              <div key={p.id} className="w-72 shrink-0 snap-start md:w-auto">
                <PropertyCard property={p} showCompare />
              </div>
            ))}
          </div>
        </section>

        {/* Cities */}
        <section>
          <SectionTitle title="حارات المكلا" />
          <div className="flex flex-wrap gap-2">
            {MUKALLA_DISTRICTS.map((c) => {
              const count = listed.filter((p) => p.district === c.name).length;
              return (
                <Link
                  key={c.name}
                  to="/search"
                  search={{ district: c.name }}
                  className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
                >
                  {c.name}
                  <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Owner CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-clay p-6 text-clay-foreground shadow-card md:p-8">
          <div className="pattern-arches absolute inset-0 opacity-60" aria-hidden />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-bold md:text-2xl">
                <ShieldCheck className="size-6" /> هل تملك عقارًا؟
              </h2>
              <p className="mt-1 max-w-md text-sm opacity-90">
                وثّق هويتك وانشر عقارك بنفسك، وتابع المشاهدات والرسائل من لوحة المالك.
              </p>
            </div>
            <Button asChild variant="glass" size="lg">
              <Link to="/owner/new">
                <Plus /> أضف عقارك
              </Link>
            </Button>
          </div>
        </section>

        {/* Latest */}
        <section>
          <SectionTitle title="أحدث العقارات" link={{ to: "/search", label: "المزيد" }} />
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            {latest.map((p) => (
              <PropertyCard key={p.id} property={p} variant="row" />
            ))}
          </div>
        </section>
      </div>
      <CompareBar />
    </div>
  );
}

function SectionTitle({ title, link }: { title: string; link?: { to: "/search"; label: string } }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-lg font-bold md:text-xl">{title}</h2>
      {link && (
        <Link to={link.to} className="flex items-center text-sm font-semibold text-primary">
          {link.label} <ChevronLeft className="size-4" />
        </Link>
      )}
    </div>
  );
}
