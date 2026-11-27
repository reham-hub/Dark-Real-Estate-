import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { BadgeCheck, Clock, FileImage, IdCard, Plus, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/dark/AuthGate";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
import { Chip } from "@/components/dark/PropertyForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DOC_TYPES, docTypeLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { fileToDataUrl } from "@/lib/images";
import { useStore } from "@/lib/store";
import type { DocType } from "@/lib/types";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "توثيق هوية المالك | دارك" },
      { name: "description", content: "وثّق هويتك كمالك عقار لتتمكن من نشر عقاراتك على دارك." },
      { property: "og:title", content: "توثيق هوية المالك | دارك" },
      { property: "og:description", content: "توثيق هوية مالك العقار قبل النشر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  return (
    <>
      <PageHeader back title="توثيق الهوية" subtitle="مطلوب قبل نشر أي عقار" />
      <PageBody className="max-w-2xl">
        <AuthGate message="سجّل الدخول لتوثيق هويتك">
          <VerifyContent />
        </AuthGate>
      </PageBody>
    </>
  );
}

function VerifyContent() {
  const { currentUser, verifications } = useStore();
  const [resubmit, setResubmit] = useState(false);
  const v = verifications.find((x) => x.userId === currentUser!.id);

  if (currentUser!.role === "admin")
    return <p className="rounded-2xl bg-card p-5 text-sm shadow-soft">حسابات الإدارة لا تحتاج إلى توثيق.</p>;

  if (v?.status === "approved")
    return (
      <StatusCard
        icon={BadgeCheck}
        tone="success"
        title="هويتك موثّقة"
        text={`تم توثيق ${docTypeLabel(v.docType)} بتاريخ ${formatDate(v.submitDate)}. يمكنك الآن نشر عقاراتك.`}
        action={
          <Button asChild>
            <Link to="/owner/new">
              <Plus /> أضف عقارًا
            </Link>
          </Button>
        }
      />
    );

  if (v?.status === "pending")
    return (
      <StatusCard
        icon={Clock}
        tone="warning"
        title="طلبك قيد المراجعة"
        text={`أُرسلت ${docTypeLabel(v.docType)} رقم ${v.docNo} في ${formatDate(v.submitDate)}. ستراجعها الإدارة وتُشعرك بالنتيجة.`}
        action={
          <Button asChild variant="outline">
            <Link to="/owner">لوحة المالك</Link>
          </Button>
        }
      />
    );

  if (v?.status === "rejected" && !resubmit)
    return (
      <StatusCard
        icon={XCircle}
        tone="destructive"
        title="تم رفض طلب التوثيق"
        text={v.note ? `السبب: ${v.note}` : "يرجى إعادة إرسال وثيقة واضحة وصالحة."}
        action={<Button onClick={() => setResubmit(true)}>إعادة الإرسال</Button>}
      />
    );

  return <VerifyForm />;
}

function StatusCard({
  icon: Icon,
  tone,
  title,
  text,
  action,
}: {
  icon: typeof Clock;
  tone: "success" | "warning" | "destructive";
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  const cls = { success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", destructive: "bg-destructive-soft text-destructive" }[tone];
  return (
    <div className="rounded-3xl bg-card p-6 text-center shadow-card">
      <span className={`mx-auto grid size-20 place-items-center rounded-full ${cls}`}>
        <Icon className="size-10" />
      </span>
      <h2 className="mt-4 font-display text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">{text}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

function VerifyForm() {
  const { submitVerification } = useStore();
  const [docType, setDocType] = useState<DocType>("national_id");
  const [docNo, setDocNo] = useState("");
  const [img, setImg] = useState<string>();
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const clean = docNo.trim();
    if (docType === "national_id" && !/^\d{8,12}$/.test(clean)) return setError("رقم البطاقة يجب أن يتكون من 8 إلى 12 رقمًا");
    if (docType === "passport" && !/^[A-Za-z0-9]{6,10}$/.test(clean)) return setError("رقم الجواز غير صالح");
    if (!img) return setError("أرفق صورة واضحة للوثيقة");
    if (!agree) return setError("يجب الإقرار بصحة البيانات");
    submitVerification(docType, clean, img);
    toast.success("تم إرسال طلب التوثيق، ستتم مراجعته من الإدارة");
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-start gap-3 rounded-3xl bg-primary-soft p-4 text-sm text-accent-foreground">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <p>نتحقق من هوية كل مالك قبل السماح له بالنشر، لضمان موثوقية الإعلانات وحماية الباحثين من الاحتيال. بياناتك محمية ولا تظهر للآخرين.</p>
      </div>

      <section className="space-y-4 rounded-3xl bg-card p-5 shadow-soft">
        <div className="space-y-2">
          <Label className="font-semibold">نوع الوثيقة</Label>
          <div className="flex flex-wrap gap-2">
            {DOC_TYPES.map((d) => (
              <Chip key={d.value} active={docType === d.value} onClick={() => setDocType(d.value)}>
                {d.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="docno" className="font-semibold">رقم الوثيقة</Label>
          <Input id="docno" dir="ltr" className="text-right" value={docNo} onChange={(e) => setDocNo(e.target.value)} placeholder={docType === "national_id" ? "مثال: 01010245781" : "مثال: 08451236"} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-semibold">صورة الوثيقة</Label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            {img ? (
              <img src={img} alt="صورة الوثيقة" className="absolute inset-0 size-full object-cover" />
            ) : (
              <>
                {docType === "national_id" ? <IdCard className="size-10" /> : <FileImage className="size-10" />}
                <span className="text-sm font-medium">اضغط لرفع صورة {docTypeLabel(docType)}</span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setImg(await fileToDataUrl(f, 1000));
            }}
          />
          {img && (
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-primary">
              تغيير الصورة
            </button>
          )}
        </div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
          <span>أقر بأن البيانات المدخلة صحيحة وأنني المالك الفعلي أو المفوّض قانونيًا للعقارات التي سأنشرها.</span>
        </label>
        {error && <p className="rounded-xl bg-destructive-soft p-3 text-sm font-medium text-destructive">{error}</p>}
      </section>
      <Button type="submit" size="lg" className="w-full">
        إرسال طلب التوثيق
      </Button>
    </form>
  );
}
