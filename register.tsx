import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/dark/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { EMAIL_RE, PHONE_RE } from "@/lib/validation";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب | دارك" },
      { name: "description", content: "أنشئ حسابك في دارك للبحث عن العقارات أو نشرها." },
      { property: "og:title", content: "إنشاء حساب | دارك" },
      { property: "og:description", content: "انضم إلى منصة دارك العقارية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});


type Errs = Partial<Record<"firstName" | "lastName" | "email" | "phone" | "password" | "confirm" | "agree", string>>;

function RegisterPage() {
  const { register } = useStore();
  const navigate = useNavigate();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errs>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Errs = {};
    if (f.firstName.trim().length < 2) er.firstName = "أدخل الاسم الأول";
    if (f.lastName.trim().length < 2) er.lastName = "أدخل اسم العائلة";
    if (!EMAIL_RE.test(f.email.trim())) er.email = "بريد إلكتروني غير صالح";
    if (!PHONE_RE.test(f.phone.trim())) er.phone = "رقم يمني من 9 أرقام يبدأ بـ 7";
    if (f.password.length < 6) er.password = "6 أحرف على الأقل";
    if (f.confirm !== f.password) er.confirm = "كلمتا المرور غير متطابقتين";
    if (!agree) er.agree = "يجب الموافقة على سياسة المنصة";
    setErrors(er);
    if (Object.keys(er).length) return;
    const res = register({
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      password: f.password,
    });
    if (!res.ok) return setErrors({ email: res.error });
    toast.success("تم إنشاء حسابك بنجاح، أهلًا بك في دارك!");
    navigate({ to: "/" });
  };

  const E = ({ k }: { k: keyof Errs }) => (errors[k] ? <p className="text-xs font-medium text-destructive">{errors[k]}</p> : null);

  return (
    <AuthLayout title="إنشاء حساب" subtitle="انضم إلى دارك خلال دقيقة">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fn">الاسم الأول</Label>
            <Input id="fn" value={f.firstName} onChange={set("firstName")} autoComplete="given-name" />
            <E k="firstName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ln">اسم العائلة</Label>
            <Input id="ln" value={f.lastName} onChange={set("lastName")} autoComplete="family-name" />
            <E k="lastName" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="em">البريد الإلكتروني</Label>
          <Input id="em" type="email" dir="ltr" className="text-right" value={f.email} onChange={set("email")} autoComplete="email" />
          <E k="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ph">رقم الجوال</Label>
          <div className="flex gap-2" dir="ltr">
            <span className="grid h-11 place-items-center rounded-xl border bg-muted px-3 text-sm text-muted-foreground">+967</span>
            <Input id="ph" inputMode="tel" value={f.phone} onChange={set("phone")} placeholder="7XXXXXXXX" maxLength={9} autoComplete="tel-national" />
          </div>
          <E k="phone" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pw">كلمة المرور</Label>
            <Input id="pw" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" />
            <E k="password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf">تأكيد كلمة المرور</Label>
            <Input id="cf" type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" />
            <E k="confirm" />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
          <span>أوافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة دارك</span>
        </label>
        <E k="agree" />
        <Button type="submit" size="lg" className="w-full">
          <UserPlus /> إنشاء الحساب
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{" "}
        <Link to="/login" search={{}} className="font-semibold text-primary">
          تسجيل الدخول
        </Link>
      </p>
    </AuthLayout>
  );
}
