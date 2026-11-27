import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/dark/AuthGate";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { EMAIL_RE, PHONE_RE } from "@/lib/validation";

export const Route = createFileRoute("/account/edit")({
  head: () => ({
    meta: [
      { title: "تعديل الحساب | دارك" },
      { name: "description", content: "عدّل بيانات حسابك وكلمة المرور في دارك." },
      { property: "og:title", content: "تعديل الحساب | دارك" },
      { property: "og:description", content: "تعديل بيانات الحساب في دارك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditAccountPage,
});

function EditAccountPage() {
  return (
    <>
      <PageHeader back title="تعديل الحساب" />
      <PageBody className="max-w-2xl">
        <AuthGate>
          <ProfileForm />
          <PasswordForm />
        </AuthGate>
      </PageBody>
    </>
  );
}

type Errs = Partial<Record<"firstName" | "lastName" | "email" | "phone", string>>;

function ProfileForm() {
  const { currentUser, updateProfile } = useStore();
  const navigate = useNavigate();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Errs>({});

  useEffect(() => {
    if (currentUser)
      setF({ firstName: currentUser.firstName, lastName: currentUser.lastName, email: currentUser.email, phone: currentUser.phone });
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Errs = {};
    if (f.firstName.trim().length < 2) er.firstName = "أدخل الاسم الأول";
    if (f.lastName.trim().length < 2) er.lastName = "أدخل اسم العائلة";
    if (!EMAIL_RE.test(f.email.trim())) er.email = "بريد إلكتروني غير صالح";
    if (!PHONE_RE.test(f.phone.trim())) er.phone = "رقم يمني من 9 أرقام يبدأ بـ 7";
    setErrors(er);
    if (Object.keys(er).length) return;
    const res = updateProfile({ firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), phone: f.phone.trim() });
    if (!res.ok) return setErrors({ email: res.error });
    toast.success("تم حفظ بيانات الحساب");
    navigate({ to: "/account" });
  };

  const E = ({ k }: { k: keyof Errs }) => (errors[k] ? <p className="text-xs font-medium text-destructive">{errors[k]}</p> : null);

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-5 shadow-soft" noValidate>
      <h2 className="font-display text-lg font-bold">البيانات الشخصية</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fn">الاسم الأول</Label>
          <Input id="fn" value={f.firstName} onChange={set("firstName")} />
          <E k="firstName" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ln">اسم العائلة</Label>
          <Input id="ln" value={f.lastName} onChange={set("lastName")} />
          <E k="lastName" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="em">البريد الإلكتروني</Label>
        <Input id="em" type="email" dir="ltr" className="text-right" value={f.email} onChange={set("email")} />
        <E k="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ph">رقم الجوال</Label>
        <div className="flex gap-2" dir="ltr">
          <span className="grid h-11 place-items-center rounded-xl border bg-muted px-3 text-sm text-muted-foreground">+967</span>
          <Input id="ph" inputMode="tel" value={f.phone} onChange={set("phone")} maxLength={9} />
        </div>
        <E k="phone" />
      </div>
      <Button type="submit" className="w-full sm:w-auto">حفظ التغييرات</Button>
    </form>
  );
}

function PasswordForm() {
  const { changePassword } = useStore();
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [cf, setCf] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 6) return setError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
    if (pw !== cf) return setError("كلمتا المرور غير متطابقتين");
    const res = changePassword(cur, pw);
    if (!res.ok) return setError(res.error);
    toast.success("تم تغيير كلمة المرور");
    setCur("");
    setPw("");
    setCf("");
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 rounded-3xl bg-card p-5 shadow-soft">
      <h2 className="font-display text-lg font-bold">تغيير كلمة المرور</h2>
      <div className="space-y-1.5">
        <Label htmlFor="cur">كلمة المرور الحالية</Label>
        <Input id="cur" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="npw">الجديدة</Label>
          <Input id="npw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ncf">تأكيدها</Label>
          <Input id="ncf" type="password" value={cf} onChange={(e) => setCf(e.target.value)} autoComplete="new-password" />
        </div>
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <Button type="submit" variant="outline">تحديث كلمة المرور</Button>
    </form>
  );
}
