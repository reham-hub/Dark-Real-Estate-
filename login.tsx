import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/dark/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_PASSWORD } from "@/lib/seed";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/login")({
  validateSearch: (raw: Record<string, unknown>): { redirect?: string | undefined } => {
    const r = raw["redirect"];
    return { redirect: typeof r === "string" && r.startsWith("/") ? r : undefined };
  },
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | دارك" },
      { name: "description", content: "سجّل الدخول إلى حسابك في دارك." },
      { property: "og:title", content: "تسجيل الدخول | دارك" },
      { property: "og:description", content: "سجّل الدخول إلى منصة دارك العقارية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

const DEMO = [
  { label: "باحث عن عقار", email: "sara@dark.ye" },
  { label: "مالك موثّق", email: "ahmed@dark.ye" },
  { label: "مدير المنصة", email: "admin@dark.ye" },
];

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const submit = (e?: React.FormEvent, creds?: { email: string; password: string }) => {
    e?.preventDefault();
    const c = creds ?? { email, password };
    if (!c.email || !c.password) return setError("أدخل البريد الإلكتروني وكلمة المرور");
    const res = login(c.email, c.password);
    if (!res.ok) return setError(res.error);
    toast.success("تم تسجيل الدخول بنجاح");
    const isAdmin = c.email.toLowerCase() === "admin@dark.ye";
    if (redirect) navigate({ to: redirect as "/" });
    else if (isAdmin) navigate({ to: "/admin", search: { tab: "overview" } });
    else navigate({ to: "/" });
  };

  return (
    <AuthLayout title="مرحبًا بعودتك" subtitle="سجّل الدخول لمتابعة رحلتك العقارية">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" type="email" dir="ltr" className="text-right" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">كلمة المرور</Label>
            <Link to="/forgot-password" className="text-xs font-semibold text-primary">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="pl-11" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>
        {error && <p className="rounded-xl bg-destructive-soft p-3 text-sm font-medium text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full">
          <LogIn /> تسجيل الدخول
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{" "}
        <Link to="/register" className="font-semibold text-primary">
          إنشاء حساب جديد
        </Link>
      </p>

      <div className="mt-8 rounded-2xl border border-dashed p-4">
        <p className="text-sm font-semibold">حسابات تجريبية</p>
        <p className="text-xs text-muted-foreground">اضغط للدخول مباشرة (كلمة المرور {DEMO_PASSWORD})</p>
        <div className="mt-3 grid gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => submit(undefined, { email: d.email, password: DEMO_PASSWORD })}
              className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-sm transition hover:bg-primary-soft"
            >
              <span className="font-semibold">{d.label}</span>
              <span className="text-xs text-muted-foreground" dir="ltr">
                {d.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
