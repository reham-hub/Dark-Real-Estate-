import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, CheckCheck, Check, Phone, SendHorizontal } from "lucide-react";
import { AuthGate } from "@/components/dark/AuthGate";
import { EmptyState } from "@/components/dark/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice, formatTime, initials } from "@/lib/format";
import { imgSrc } from "@/lib/images";
import { fullName, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/messages/$id")({
  head: () => ({
    meta: [
      { title: "محادثة | دارك" },
      { name: "description", content: "محادثة مباشرة حول عقار على منصة دارك." },
      { property: "og:title", content: "محادثة | دارك" },
      { property: "og:description", content: "محادثة مباشرة مع مالك العقار." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

const QUICK = ["هل العقار ما زال متاحًا؟", "هل السعر قابل للتفاوض؟", "متى يمكنني المعاينة؟"];

function ChatPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <AuthGateWrapper />
    </div>
  );
}

function AuthGateWrapper() {
  const { currentUser, hydrated } = useStore();
  if (!hydrated || !currentUser)
    return (
      <div className="px-4 py-10">
        <AuthGate message="سجّل الدخول لعرض المحادثة">{null}</AuthGate>
      </div>
    );
  return <Chat />;
}

function Chat() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { conversations, currentUser, userById, propertyById, sendMessage, markRead, getVerificationStatus } = useStore();
  const conv = conversations.find((c) => c.id === id);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const msgCount = conv?.messages.length ?? 0;

  useEffect(() => {
    if (conv) markRead(conv.id);
    endRef.current?.scrollIntoView({ block: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv?.id, msgCount]);

  if (!conv || (conv.seekerId !== currentUser!.id && conv.ownerId !== currentUser!.id)) {
    return (
      <div className="px-4 py-10">
        <EmptyState icon={MessageCircle} title="المحادثة غير موجودة" action={<Button asChild><Link to="/messages">الرسائل</Link></Button>} />
      </div>
    );
  }

  const other = userById(conv.seekerId === currentUser!.id ? conv.ownerId : conv.seekerId);
  const p = propertyById(conv.propertyId);

  const send = (content: string) => {
    if (!content.trim()) return;
    sendMessage(conv.id, content);
    setText("");
  };

  let lastDay = "";

  return (
    <div className="flex h-[100dvh] flex-col md:h-[calc(100dvh-4rem)]">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button onClick={() => router.history.back()} className="grid size-10 place-items-center rounded-full hover:bg-muted" aria-label="رجوع">
            <ArrowRight className="size-5" />
          </button>
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary-soft font-bold text-primary">{initials(other?.firstName, other?.lastName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate font-bold">
              {fullName(other)}
              {other && getVerificationStatus(other.id) === "approved" && <BadgeCheck className="size-4 text-success" />}
            </p>
            <p className="text-xs text-muted-foreground">{conv.ownerId === other?.id ? "مالك العقار" : "مهتم بعقارك"}</p>
          </div>
          {other && (
            <Button asChild variant="ghost" size="icon" aria-label="اتصال">
              <a href={`tel:+967${other.phone}`}>
                <Phone className="size-5" />
              </a>
            </Button>
          )}
        </div>
        {p && (
          <Link to="/property/$id" params={{ id: p.id }} className="mx-3 mb-2.5 flex items-center gap-3 rounded-xl bg-muted p-2">
            <img src={imgSrc(p.images[0])} alt="" className="size-11 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.title}</p>
              <p className="text-xs font-bold text-primary">{formatPrice(p.price, p.purpose)}</p>
            </div>
          </Link>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto bg-background px-3 py-4">
        {conv.messages.length === 0 && (
          <p className="mx-auto max-w-xs rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground shadow-soft">
            ابدأ محادثتك مع {fullName(other)} مباشرة. لا تشارك معلومات مالية حساسة قبل المعاينة.
          </p>
        )}
        {conv.messages.map((m) => {
          const mine = m.senderId === currentUser!.id;
          const day = m.sentAt.slice(0, 10);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && (
                <p className="my-3 text-center text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1">{formatDate(m.sentAt)}</span>
                </p>
              )}
              <div className={cn("flex", mine ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-6 shadow-soft",
                    mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card",
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", mine ? "opacity-75" : "text-muted-foreground")}>
                    {formatTime(m.sentAt)}
                    {mine && (m.read ? <CheckCheck className="size-3.5" /> : <Check className="size-3.5" />)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-t bg-card px-3 pt-2" style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}>
        {conv.messages.length === 0 && conv.seekerId === currentUser!.id && (
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
            {QUICK.map((q) => (
              <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary">
                {q}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={1}
            placeholder="اكتب رسالتك..."
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border bg-background px-4 py-2.5 text-base outline-none focus:border-primary"
            aria-label="نص الرسالة"
          />
          <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full" disabled={!text.trim()} aria-label="إرسال">
            <SendHorizontal className="size-5 rotate-180" />
          </Button>
        </form>
      </div>
    </div>
  );
}
