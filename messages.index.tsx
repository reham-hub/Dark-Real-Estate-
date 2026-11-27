import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { AuthGate } from "@/components/dark/AuthGate";
import { EmptyState } from "@/components/dark/EmptyState";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { imgSrc } from "@/lib/images";
import { fullName, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages/")({
  head: () => ({
    meta: [
      { title: "الرسائل | دارك" },
      { name: "description", content: "محادثاتك المباشرة مع ملاك العقارات والباحثين." },
      { property: "og:title", content: "الرسائل | دارك" },
      { property: "og:description", content: "تواصل مباشر بين الباحثين وملاك العقارات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { myConversations, currentUser, userById, propertyById } = useStore();
  const sorted = [...myConversations].sort((a, b) => {
    const la = a.messages.at(-1)?.sentAt ?? "";
    const lb = b.messages.at(-1)?.sentAt ?? "";
    return lb.localeCompare(la);
  });

  return (
    <>
      <PageHeader title="الرسائل" subtitle="تواصل مباشر بدون وسطاء" />
      <PageBody>
        <AuthGate message="سجّل الدخول لعرض محادثاتك">
          {sorted.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="لا توجد محادثات"
              description="افتح أي عقار واضغط «مراسلة المالك» لبدء محادثة مباشرة."
              action={
                <Button asChild>
                  <Link to="/search">تصفح العقارات</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {sorted.map((c) => {
                const other = userById(c.seekerId === currentUser?.id ? c.ownerId : c.seekerId);
                const p = propertyById(c.propertyId);
                const last = c.messages.at(-1);
                const unread = c.messages.filter((m) => m.senderId !== currentUser?.id && !m.read).length;
                const iAmOwner = c.ownerId === currentUser?.id;
                return (
                  <li key={c.id}>
                    <Link
                      to="/messages/$id"
                      params={{ id: c.id }}
                      className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft transition hover:shadow-card"
                    >
                      <img src={imgSrc(p?.images[0])} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-bold">{fullName(other)}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{last ? timeAgo(last.sentAt) : ""}</span>
                        </div>
                        <p className="truncate text-xs text-primary">
                          {iAmOwner ? "استفسار عن عقارك: " : ""}
                          {p?.title ?? "عقار محذوف"}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("truncate text-sm", unread ? "font-semibold text-foreground" : "text-muted-foreground")}>
                            {last ? `${last.senderId === currentUser?.id ? "أنت: " : ""}${last.content}` : "ابدأ المحادثة..."}
                          </p>
                          {unread > 0 && (
                            <span className="grid min-w-5 place-items-center rounded-full bg-clay px-1.5 text-xs font-bold text-clay-foreground">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </AuthGate>
      </PageBody>
    </>
  );
}
